const router = require('express').Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// GET /api/users
router.get('/', async (req, res) => {
  res.json(await User.find().sort('name'));
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    const u = await User.create({ name, username, password, role });
    res.status(201).json({ id: u._id, name: u.name, username: u.username, role: u.role });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Username already taken' });
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/users/:id — edit name/role/password or enable/disable
router.put('/:id', async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select('+password');
    if (!u) return res.status(404).json({ message: 'User not found' });
    if (String(u._id) === String(req.user._id) && req.body.active === false) {
      return res.status(400).json({ message: 'You cannot disable your own account' });
    }
    ['name', 'username', 'role', 'active'].forEach(k => {
      if (req.body[k] !== undefined) u[k] = req.body[k];
    });
    if (req.body.password) u.password = req.body.password; // re-hashed by pre-save hook
    await u.save();
    res.json({ id: u._id, name: u.name, username: u.username, role: u.role, active: u.active });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
