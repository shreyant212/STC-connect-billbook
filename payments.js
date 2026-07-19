const router = require('express').Router();
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Bill = require('../models/Bill');
const Purchase = require('../models/Purchase');
const Counter = require('../models/Counter');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/payments?party=customer&partyId=
router.get('/', async (req, res) => {
  const { party, partyId } = req.query;
  const q = {};
  if (party) q.party = party;
  if (partyId) q.partyId = partyId;
  res.json(await Payment.find(q).sort('-createdAt').limit(100));
});

/*
 POST /api/payments — collect from a customer (type 'in') or pay a supplier
 (type 'out'). Reduces the party balance and settles the oldest open
 bills/POs first, exactly like a shop ledger.
 Body: { party: 'customer'|'supplier', partyId, amount, mode, note }
*/
router.post('/', async (req, res) => {
  try {
    const { party, partyId, amount, mode = 'Cash', note = '' } = req.body;
    const Model = party === 'customer' ? Customer : Supplier;
    const rec = await Model.findById(partyId);
    if (!rec) return res.status(404).json({ message: 'Party not found' });

    const amt = Math.min(Math.max(Math.round(Number(amount) || 0), 1), Math.max(rec.balance, 0));
    if (!amt) return res.status(400).json({ message: 'Nothing outstanding to settle' });

    const seq = await Counter.next('payment');
    const payment = await Payment.create({
      no: 'PAY-' + String(seq).padStart(4, '0'),
      type: party === 'customer' ? 'in' : 'out',
      party, partyId, partyModel: party === 'customer' ? 'Customer' : 'Supplier',
      amount: amt, mode, note, createdBy: req.user._id
    });

    await Model.updateOne({ _id: partyId }, { $inc: { balance: -amt } });

    // settle oldest dues first
    let left = amt;
    if (party === 'customer') {
      const open = await Bill.find({ customer: partyId, due: { $gt: 0 } }).sort('createdAt');
      for (const b of open) {
        if (left <= 0) break;
        const take = Math.min(b.due, left);
        b.due -= take; b.paid += take; left -= take;
        await b.save();
      }
    } else {
      const open = await Purchase.find({ supplier: partyId, due: { $gt: 0 } }).sort('createdAt');
      for (const po of open) {
        if (left <= 0) break;
        const take = Math.min(po.due, left);
        po.due -= take; po.paid += take; left -= take;
        await po.save();
      }
    }

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
