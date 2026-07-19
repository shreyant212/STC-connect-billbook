const router = require('express').Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/products?search=&category=&lowStock=true
router.get('/', async (req, res) => {
  const { search, category, lowStock } = req.query;
  const q = { active: true };
  if (search) {
    q.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) q.category = category;
  let items = await Product.find(q).sort('name');
  if (lowStock === 'true') {
    items = items.filter(p => p.stock.showroom + p.stock.godown <= p.minStock);
  }
  res.json(items);
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Product not found' });
  res.json(p);
});

// POST /api/products  (admin/manager)
router.post('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json(p);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'That SKU already exists' });
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id  (admin/manager)
router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id — soft delete so old bills keep their data (admin/manager)
router.delete('/:id', authorize('admin', 'manager'), async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!p) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product removed from catalogue' });
});

module.exports = router;
