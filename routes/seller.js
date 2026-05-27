const express = require('express');
const router = express.Router();
const pool = require('../db');

function requireSeller(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  if (req.session.user.role !== 'seller') {
    return res.redirect('/');
  }

  next();
}

async function renderSellerProductsPage(req, res, next, options = {}) {
  try {
    const sellerId = req.session.user.id;

    const [products] = await pool.execute(
      `
      SELECT
        product_id,
        product_name,
        brand_id,
        category_id,
        description,
        specifications,
        image_url,
        is_promotion,
        is_active,
        seller_id,
        quantity,
        created_at
      FROM products
      WHERE seller_id = ?
      ORDER BY product_id DESC
      `,
      [sellerId]
    );

    res.render('seller/products', {
      products,
      editProduct: options.editProduct || null,
      error: options.error || null,
      success: options.success || null
    });
  } catch (err) {
    next(err);
  }
}

/* =========================
   SELLER - QUẢN LÝ SẢN PHẨM
========================= */

router.get('/products', requireSeller, async (req, res, next) => {
  await renderSellerProductsPage(req, res, next);
});

router.post('/products/add', requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.session.user.id;

    const {
      product_name,
      brand_id,
      category_id,
      description,
      specifications,
      image_url,
      is_promotion,
      is_active,
      quantity
    } = req.body;

    if (!product_name || !brand_id || !category_id) {
      return await renderSellerProductsPage(req, res, next, {
        error: 'Vui lòng nhập tên sản phẩm, brand_id và category_id'
      });
    }

    await pool.execute(
      `
      INSERT INTO products (
        product_name,
        brand_id,
        category_id,
        description,
        specifications,
        image_url,
        is_promotion,
        is_active,
        seller_id,
        quantity
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        product_name,
        Number(brand_id),
        Number(category_id),
        description || null,
        specifications || null,
        image_url || null,
        is_promotion ? 1 : 0,
        is_active ? 1 : 0,
        sellerId,
        Number(quantity || 0)
      ]
    );

    res.redirect('/seller/products');
  } catch (err) {
    next(err);
  }
});

router.get('/products/:id/edit', requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.session.user.id;
    const productId = req.params.id;

    const [rows] = await pool.execute(
      `
      SELECT *
      FROM products
      WHERE product_id = ? AND seller_id = ?
      `,
      [productId, sellerId]
    );

    if (rows.length === 0) {
      return await renderSellerProductsPage(req, res, next, {
        error: 'Không tìm thấy sản phẩm hoặc bạn không có quyền sửa sản phẩm này'
      });
    }

    await renderSellerProductsPage(req, res, next, {
      editProduct: rows[0]
    });
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/edit', requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.session.user.id;
    const productId = req.params.id;

    const {
      product_name,
      brand_id,
      category_id,
      description,
      specifications,
      image_url,
      is_promotion,
      is_active,
      quantity
    } = req.body;

    if (!product_name || !brand_id || !category_id) {
      const [rows] = await pool.execute(
        `
        SELECT *
        FROM products
        WHERE product_id = ? AND seller_id = ?
        `,
        [productId, sellerId]
      );

      return await renderSellerProductsPage(req, res, next, {
        editProduct: rows[0] || null,
        error: 'Vui lòng nhập tên sản phẩm, brand_id và category_id'
      });
    }

    await pool.execute(
      `
      UPDATE products
      SET
        product_name = ?,
        brand_id = ?,
        category_id = ?,
        description = ?,
        specifications = ?,
        image_url = ?,
        is_promotion = ?,
        is_active = ?,
        quantity = ?
      WHERE product_id = ? AND seller_id = ?
      `,
      [
        product_name,
        Number(brand_id),
        Number(category_id),
        description || null,
        specifications || null,
        image_url || null,
        is_promotion ? 1 : 0,
        is_active ? 1 : 0,
        Number(quantity || 0),
        productId,
        sellerId
      ]
    );

    res.redirect('/seller/products');
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/delete', requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.session.user.id;
    const productId = req.params.id;

    await pool.execute(
      `
      UPDATE products
      SET is_active = FALSE
      WHERE product_id = ? AND seller_id = ?
      `,
      [productId, sellerId]
    );

    res.redirect('/seller/products');
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/restore', requireSeller, async (req, res, next) => {
  try {
    const sellerId = req.session.user.id;
    const productId = req.params.id;

    await pool.execute(
      `
      UPDATE products
      SET is_active = TRUE
      WHERE product_id = ? AND seller_id = ?
      `,
      [productId, sellerId]
    );

    res.redirect('/seller/products');
  } catch (err) {
    next(err);
  }
});

module.exports = router;