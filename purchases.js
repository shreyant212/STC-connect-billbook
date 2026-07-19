const router = require('express').Router();
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Payment = require('../models/Payment');
const InventoryLog = require('../models/InventoryLog');
const Counter = require('../models/Counter');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'manager'));

// GET /api/purchases
router.get('/', async (req, res) => {
  res.json(await Purchase.find().populate('supplier', 'name').sort('-createdAt').limit(100));
});

/*
 POST /api/purchases — receive stock from a supplier.
 Body: { supplierId, receiveInto, items: [{ productId, qty, cost }], paid, note }
 Adds stock, updates latest purchase price, raises supplier balance for the
 unpaid portion, and records the payment made now (if any).
*/
router.post('/', async (req, res) => {
  try {
    const { supplierId, receiveInto = 'godown', items = [], paid = 0, note = '' } = req.body;
    if (!items.length) return res.status(400).json({ message: 'Add at least one line' });
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(400).json({ message: 'Supplier not found' });

    const lines = [];
    for (const it of items) {
      const p = await Product.findById(it.productId);
      const qty = Math.floor(Number(it.qty) || 0);
      const cost = Number(it.cost) || 0;
      if (!p || qty < 1) return res.status(400).json({ message: 'Invalid purchase line' });
      lines.push({ product: p._id, sku: p.sku, name: p.name, qty, cost, gst: p.gst });
    }

    const goods = lines.reduce((t, l) => t + l.qty * l.cost, 0);
    const total = Math.round(goods + lines.reduce((t, l) => t + (l.qty * l.cost * l.gst) / 100, 0));
    const paidAmt = Math.min(Math.max(Number(paid) || 0, 0), total);

    const seq = await Counter.next('po');
    const po = await Purchase.create({
      no: 'PO-' + String(seq).padStart(3, '0'),
      supplier: supplier._id, items: lines, receiveInto,
      total, paid: paidAmt, due: total - paidAmt, note, createdBy: req.user._id
    });

    for (const l of lines) {
      await Product.updateOne(
        { _id: l.product },
        { $inc: { [`stock.${receiveInto}`]: l.qty }, $set: { purchasePrice: l.cost } }
      );
      await InventoryLog.create({
        type: 'purchase', product: l.product, productName: l.name,
        qty: l.qty, store: receiveInto, note: `${po.no} · ${supplier.name}`, createdBy: req.user._id
      });
    }

    if (po.due > 0) await Supplier.updateOne({ _id: supplier._id }, { $inc: { balance: po.due } });
    if (paidAmt > 0) {
      const pseq = await Counter.next('payment');
      await Payment.create({
        no: 'PAY-' + String(pseq).padStart(4, '0'),
        type: 'out', party: 'supplier', partyId: supplier._id, partyModel: 'Supplier',
        amount: paidAmt, mode: 'Bank', note: 'Against ' + po.no, createdBy: req.user._id
      });
    }

    res.status(201).json(po);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
