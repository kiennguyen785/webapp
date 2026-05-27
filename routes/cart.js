const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  next();
}

// Xem giỏ hàng
router.get('/', requireLogin, async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      `
      SELECT
        c.id,
        c.user_id,
        c.product_id,
        c.quantity,
        p.product_name,
        p.price,
        p.image_url
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.id DESC
      `,
      [req.session.user.id]
    );

    let total = 0;

    items.forEach(item => {
      total += Number(item.price) * Number(item.quantity);
    });

    res.render('cart', {
      items,
      total
    });
  } catch (err) {
    next(err);
  }
});

// Thêm sản phẩm vào giỏ hàng
router.post('/add/:id', requireLogin, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user.id;

    const [products] = await pool.execute(
      `
      SELECT id
      FROM products
      WHERE id = ?
      `,
      [productId]
    );

    if (products.length === 0) {
      return res.redirect('/products');
    }

    await pool.execute(
      `
      INSERT INTO cart_items(user_id, product_id, quantity)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE quantity = quantity + 1
      `,
      [userId, productId]
    );

    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
});

// Tăng số lượng
router.post('/api/increase/:productId', requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const productId = req.params.productId;

    await pool.execute(
      `
      UPDATE cart_items
      SET quantity = quantity + 1
      WHERE user_id = ? AND product_id = ?
      `,
      [userId, productId]
    );

    const [rows] = await pool.execute(
      `
      SELECT quantity
      FROM cart_items
      WHERE user_id = ? AND product_id = ?
      `,
      [userId, productId]
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    res.json({
      success: true,
      quantity: rows[0].quantity
    });
  } catch (err) {
    next(err);
  }
});

// Giảm số lượng
router.post('/api/decrease/:productId', requireLogin, async (req, res, next) => {
  try {
    const userId = req.session.user.id;
    const productId = req.params.productId;

    await pool.execute(
      `
      UPDATE cart_items
      SET quantity = quantity - 1
      WHERE user_id = ?
        AND product_id = ?
        AND quantity > 1
      `,
      [userId, productId]
    );

    const [rows] = await pool.execute(
      `
      SELECT quantity
      FROM cart_items
      WHERE user_id = ? AND product_id = ?
      `,
      [userId, productId]
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    res.json({
      success: true,
      quantity: rows[0].quantity
    });
  } catch (err) {
    next(err);
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.post('/remove/:id', requireLogin, async (req, res, next) => {
  try {
    await pool.execute(
      `
      DELETE FROM cart_items
      WHERE id = ? AND user_id = ?
      `,
      [req.params.id, req.session.user.id]
    );

    res.redirect('/cart');
  } catch (err) {
    next(err);
  }
});

module.exports = router;