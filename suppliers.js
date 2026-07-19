const router = require('express').Router();
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'manager'));

// GET /api/suppliers
router.get('/', async (req, res) => {
  res.json(await Supplier.find().sort('name'));
});

// GET /api/suppliers/:id — with purchase orders
router.get('/:id', async (req, res) => {
  const s = await Supplier.findById(req.params.id);
  if (!s) return res.status(404).json({ message: 'Supplier not found' });
  const purchases = await Purchase.find({ supplier: s._id }).sort('-createdAt');
  res.json({ supplier: s, purchases });
});

// POST /api/suppliers
router.post('/', async (req, res) => {
  try {
    res.status(201).json(await Supplier.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
  const s = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!s) return res.status(404).json({ message: 'Supplier not found' });
  res.json(s);
});

module.exports = router;
