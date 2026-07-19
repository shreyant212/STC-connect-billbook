const router = require('express').Router();
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/customers?search=&dueOnly=true
router.get('/', async (req, res) => {
  const { search, dueOnly } = req.query;
  const q = {};
  if (search) {
    q.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search } }
    ];
  }
  if (dueOnly === 'true') q.balance = { $gt: 0 };
  res.json(await Customer.find(q).sort('name'));
});

// GET /api/customers/:id — profile + purchase history + payments
router.get('/:id', async (req, res) => {
  const c = await Customer.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Customer not found' });
  const bills = await Bill.find({ customer: c._id }).sort('-createdAt').limit(50);
  const payments = await Payment.find({ party: 'customer', partyId: c._id }).sort('-createdAt').limit(20);
  res.json({ customer: c, bills, payments });
});

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    res.status(201).json(await Customer.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!c) return res.status(404).json({ message: 'Customer not found' });
  res.json(c);
});

module.exports = router;
