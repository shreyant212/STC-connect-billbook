const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

function sign(user) {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: process.env.JWT_EXPIRES || '12h' }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: (username || '').toLowerCase() }).select('+password');
  if (!user || user.active === false || !(await user.matchPassword(password || ''))) {
    return res.status(401).json({ message: 'Wrong username or password' });
  }
  res.json({
    token: sign(user),
    user: { id: user._id, name: user.name, username: user.username, role: user.role }
  });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  const { _id, name, username, role } = req.user;
  res.json({ id: _id, name, username, role });
});

module.exports = router;
