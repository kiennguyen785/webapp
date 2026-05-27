const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  if (req.session.user.role !== 'admin') {
    return res.redirect('/');
  }

  next();
}

/* =========================
   ADMIN - QUẢN LÝ TÀI KHOẢN
========================= */

// Danh sách tài khoản
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const [users] = await pool.execute(`
      SELECT id, full_name, email, phone, address, role, is_active, created_at
      FROM users
      ORDER BY id DESC
    `);

    res.render('admin/users', {
      users,
      user: req.session.user
    });
  } catch (err) {
    next(err);
  }
});

// Đổi quyền user / seller / admin
router.post('/users/:id/role', requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (Number(userId) === Number(req.session.user.id)) {
      return res.redirect('/admin/users');
    }

    const allowedRoles = ['user', 'seller', 'admin'];
    const newRole = allowedRoles.includes(role) ? role : 'user';

    await pool.execute(
      `UPDATE users SET role = ?, is_active = 1 WHERE id = ?`,
      [newRole, userId]
    );

    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
});

// Khóa tài khoản
router.post('/users/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (Number(userId) === Number(req.session.user.id)) {
      return res.redirect('/admin/users');
    }

    await pool.execute(
      `UPDATE users SET is_active = 0 WHERE id = ?`,
      [userId]
    );

    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
});

// Mở khóa tài khoản
router.post('/users/:id/restore', requireAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;

    await pool.execute(
      `UPDATE users SET is_active = 1 WHERE id = ?`,
      [userId]
    );

    res.redirect('/admin/users');
  } catch (err) {
    next(err);
  }
});


/* =========================
   ADMIN - QUẢN LÝ SẢN PHẨM
========================= */

// Danh sách sản phẩm
router.get('/products', requireAdmin, async (req, res, next) => {
  try {
    const [products] = await pool.execute(`
      SELECT 
        p.id,
        p.product_name,
        p.brand,
        p.category,
        p.price,
        p.description,
        p.image_url,
        p.seller_id,
        p.quantity,
        p.created_at,
        u.full_name AS seller_name
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      ORDER BY p.id DESC
    `);

    res.render('admin/products', {
      products,
      user: req.session.user
    });
  } catch (err) {
    next(err);
  }
});
async function getProductFormOptions() {
  const [sellers] = await pool.execute(`
    SELECT id, full_name, email
    FROM users
    WHERE role = 'seller' AND is_active = 1
    ORDER BY full_name ASC
  `);

  const [brands] = await pool.execute(`
    SELECT DISTINCT brand
    FROM products
    WHERE brand IS NOT NULL AND brand <> ''
    ORDER BY brand ASC
  `);

  const [categories] = await pool.execute(`
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL AND category <> ''
    ORDER BY category ASC
  `);

  return { sellers, brands, categories };
}
// Form thêm sản phẩm
router.get('/products/add', requireAdmin, async (req, res, next) => {
  try {
    const { sellers, brands, categories } = await getProductFormOptions();

    res.render('admin/product-form', {
      product: null,
      sellers,
      brands,
      categories,
      action: '/admin/products/add',
      title: 'Thêm sản phẩm'
    });
  } catch (err) {
    next(err);
  }
});

// Xử lý thêm sản phẩm
router.post('/products/add', requireAdmin, async (req, res, next) => {
  try {
    const {
      product_name,
      brand,
      category,
      price,
      description,
      image_url,
      seller_id,
      quantity
    } = req.body;

    await pool.execute(`
      INSERT INTO products
      (product_name, brand, category, price,description, image_url, seller_id, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      product_name,
      brand,
      category,
      price || 0,

      description,
      image_url,
      seller_id || null,
      quantity || 0
    ]);

    res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
});

// Form sửa sản phẩm
router.get('/products/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const productId = req.params.id;

    const [rows] = await pool.execute(
      `SELECT * FROM products WHERE id = ?`,
      [productId]
    );

    if (rows.length === 0) {
      return res.redirect('/admin/products');
    }

    const { sellers, brands, categories } = await getProductFormOptions();

    res.render('admin/product-form', {
      product: rows[0],
      sellers,
      brands,
      categories,
      action: `/admin/products/${productId}/edit`,
      title: 'Sửa sản phẩm'
    });
  } catch (err) {
    next(err);
  }
});

// Xử lý sửa sản phẩm
router.post('/products/:id/edit', requireAdmin, async (req, res, next) => {
  try {
    const productId = req.params.id;

    const {
      product_name,
      brand,
      category,
      price,
      description,
      image_url,
      seller_id,
      quantity
    } = req.body;

    await pool.execute(`
      UPDATE products
      SET product_name = ?,
          brand = ?,
          category = ?,
          price = ?,
          description = ?,
          image_url = ?,
          seller_id = ?,
          quantity = ?
      WHERE id = ?
    `, [
      product_name,
      brand,
      category,
      price || 0,
      description,
      image_url,
      seller_id || null,
      quantity || 0,
      productId
    ]);

    res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
});

// Xóa sản phẩm
router.post('/products/:id/delete', requireAdmin, async (req, res, next) => {
  try {
    const productId = req.params.id;

    await pool.execute(
      `DELETE FROM products WHERE id = ?`,
      [productId]
    );

    res.redirect('/admin/products');
  } catch (err) {
    next(err);
  }
});

module.exports = router;