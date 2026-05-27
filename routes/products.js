const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const { q, category } = req.query;

  let sql = 'SELECT * FROM products WHERE 1=1';
  let params = [];

  if (q) {
    sql += ' AND product_name LIKE ?';
    params.push(`%${q}%`);
  }

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY id DESC';

  const [products] = await pool.execute(sql, params);
  const [categories] = await pool.query(`
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL
    AND category <> ''
    ORDER BY category
  `);
  res.render('products', {
    products,
    categories,
    q,
    category
  });
});

router.get('/:id', async (req, res) => {
  const productId = req.params.id;

  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [productId]);

  if (rows.length === 0) {
    return res.send('Không tìm thấy sản phẩm');
  }
  res.render('product-detail', {
    product: rows[0]
  });
});

module.exports = router;