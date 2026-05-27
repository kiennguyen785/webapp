const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
}

router.get('/', requireLogin, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, phone, address FROM users WHERE id = ?',
    [req.session.user.id]
  );

  res.render('profile', { userInfo: rows[0] });
});

router.post('/', requireLogin, async (req, res) => {
  const { full_name, phone, address } = req.body;

  await pool.execute(
    'UPDATE users SET full_name = ?, phone = ?, address = ? WHERE id = ?',
    [full_name, phone, address, req.session.user.id]
  );

  req.session.user.full_name = full_name;

  res.redirect('/profile');
});

module.exports = router;