const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
}

router.post('/checkout', requireLogin, async (req, res) => {
  const userId = req.session.user.id;

  const [cartItems] = await pool.execute(`
    SELECT c.*, p.price
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `, [userId]);

  if (cartItems.length === 0) return res.redirect('/cart');

  const total = cartItems.reduce((sum, item) => {
    return sum + Number(item.price) * item.quantity;
  }, 0);

  const [orderResult] = await pool.execute(
    'INSERT INTO orders(user_id, total_price, status) VALUES (?, ?, ?)',
    [userId, total, 'success']
  );

  const orderId = orderResult.insertId;

  for (const item of cartItems) {

    await pool.execute(
      `
      INSERT INTO order_items(
        order_id,
        product_id,
        quantity,
        price
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        orderId,
        item.product_id,
        item.quantity,
        item.price
      ]
    );

    await pool.execute(
      `
      UPDATE products
      SET quantity = quantity - ?
      WHERE id = ?
      AND quantity >= ?
      `,
      [
        item.quantity,
        item.product_id,
        item.quantity
      ]
    );

  }

  await pool.execute(
    'DELETE FROM cart_items WHERE user_id = ?',
    [userId]
  );

  res.redirect('/orders');

  });
router.get('/', requireLogin, async (req, res) => {
  const [orders] = await pool.execute(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC',
    [req.session.user.id]
  );

  res.render('orders', { orders });
});

module.exports = router;