const router = require('express').Router();
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const InventoryLog = require('../models/InventoryLog');
const Counter = require('../models/Counter');
const { computeBill } = require('../utils/gst');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/bills?from=&to=&customer=
router.get('/', async (req, res) => {
  const { from, to, customer } = req.query;
  const q = {};
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }
  if (customer) q.customer = customer;
  res.json(await Bill.find(q).sort('-createdAt').limit(200));
});

// GET /api/bills/:id
router.get('/:id', async (req, res) => {
  const b = await Bill.findById(req.params.id).populate('customer', 'name phone address gstin');
  if (!b) return res.status(404).json({ message: 'Bill not found' });
  res.json(b);
});

/*
 POST /api/bills — the core POS checkout.
 Body: {
   customerId, store: 'showroom'|'godown',
   items: [{ productId, qty }],
   discount: { type: 'pct'|'flat', val },
   paid, mode: 'Cash'|'UPI'|'Card'|'Credit'
 }
 Prices, GST and totals are recomputed on the server from Product docs —
 never trusted from the client.
*/
router.post('/', async (req, res) => {
  try {
    const { customerId, items = [], discount, paid = 0, mode = 'Cash', store = 'showroom' } = req.body;
    if (!items.length) return res.status(400).json({ message: 'Bill has no items' });

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(400).json({ message: 'Pick a customer first' });

    // Load products and check stock at the selling location
    const lines = [];
    for (const it of items) {
      const p = await Product.findById(it.productId);
      const qty = Math.floor(Number(it.qty) || 0);
      if (!p || qty < 1) return res.status(400).json({ message: 'Invalid item in bill' });
      if (p.stock[store] < qty) {
        return res.status(400).json({ message: `Only ${p.stock[store]} pcs of ${p.name} in ${store}` });
      }
      lines.push({
        product: p._id, sku: p.sku, name: p.name, hsn: p.hsn,
        qty, price: p.sellingPrice, purchasePrice: p.purchasePrice, gst: p.gst
      });
    }

    const calc = computeBill(lines, discount);
    const paidAmt = Math.min(Math.max(Number(paid) || 0, 0), calc.total);
    const due = calc.total - paidAmt;
    if (due > 0 && customer.walkin) {
      return res.status(400).json({ message: 'Credit sales need a saved customer' });
    }

    const seq = await Counter.next('bill');
    const bill = await Bill.create({
      no: 'STC-' + String(seq).padStart(4, '0'),
      customer: customer._id, customerName: customer.name,
      items: lines,
      subTotal: calc.subTotal, discount: calc.discount, taxable: calc.taxable,
      cgst: calc.cgst, sgst: calc.sgst, roundOff: calc.roundOff, total: calc.total,
      paid: paidAmt, due,
      mode: due > 0 && paidAmt === 0 ? 'Credit' : mode,
      store, createdBy: req.user._id
    });

    // Deduct stock + write inventory logs
    for (const l of lines) {
      await Product.updateOne({ _id: l.product }, { $inc: { [`stock.${store}`]: -l.qty } });
      await InventoryLog.create({
        type: 'sale', product: l.product, productName: l.name,
        qty: -l.qty, store, note: bill.no, createdBy: req.user._id
      });
    }

    // Credit book + payment record
    if (due > 0) await Customer.updateOne({ _id: customer._id }, { $inc: { balance: due } });
    if (paidAmt > 0) {
      const pseq = await Counter.next('payment');
      await Payment.create({
        no: 'PAY-' + String(pseq).padStart(4, '0'),
        type: 'in', party: 'customer', partyId: customer._id, partyModel: 'Customer',
        amount: paidAmt, mode: bill.mode === 'Credit' ? 'Cash' : bill.mode,
        note: 'Bill ' + bill.no, createdBy: req.user._id
      });
    }

    res.status(201).json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
