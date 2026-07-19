const router = require('express').Router();
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'manager'));

// GET /api/inventory/logs
router.get('/logs', async (req, res) => {
  res.json(await InventoryLog.find().sort('-createdAt').limit(100));
});

/*
 POST /api/inventory/adjust — manual stock in/out.
 Body: { productId, store: 'showroom'|'godown', qty, type: 'in'|'out', note }
*/
router.post('/adjust', async (req, res) => {
  try {
    const { productId, store = 'showroom', qty, type, note = '' } = req.body;
    const p = await Product.findById(productId);
    const n = Math.floor(Number(qty) || 0);
    if (!p || n < 1 || !['in', 'out'].includes(type)) {
      return res.status(400).json({ message: 'Invalid adjustment' });
    }
    if (type === 'out' && p.stock[store] < n) {
      return res.status(400).json({ message: `Only ${p.stock[store]} pcs in ${store}` });
    }
    await Product.updateOne({ _id: p._id }, { $inc: { [`stock.${store}`]: type === 'in' ? n : -n } });
    const log = await InventoryLog.create({
      type, product: p._id, productName: p.name,
      qty: type === 'in' ? n : -n, store, note, createdBy: req.user._id
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/*
 POST /api/inventory/transfer — move stock between locations.
 Body: { productId, from, to, qty, note }
*/
router.post('/transfer', async (req, res) => {
  try {
    const { productId, from, to, qty, note = '' } = req.body;
    const p = await Product.findById(productId);
    const n = Math.floor(Number(qty) || 0);
    if (!p || n < 1 || from === to || !['showroom', 'godown'].includes(from) || !['showroom', 'godown'].includes(to)) {
      return res.status(400).json({ message: 'Invalid transfer' });
    }
    if (p.stock[from] < n) {
      return res.status(400).json({ message: `Only ${p.stock[from]} pcs in ${from}` });
    }
    await Product.updateOne(
      { _id: p._id },
      { $inc: { [`stock.${from}`]: -n, [`stock.${to}`]: n } }
    );
    const log = await InventoryLog.create({
      type: 'transfer', product: p._id, productName: p.name,
      qty: n, store: `${from} → ${to}`, note, createdBy: req.user._id
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
