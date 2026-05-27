var express = require('express');
var router = express.Router();
const pool = require('../db');

router.get('/', async function(req, res) {

  const [products] = await pool.query(`
    SELECT *
    FROM products
    ORDER BY id DESC
    LIMIT 12
  `);

  const [categories] = await pool.query(`
    SELECT DISTINCT category
    FROM products
    WHERE category IS NOT NULL
    AND category <> ''
    ORDER BY category
  `);

  res.render('index', {
    title: 'Sports Shop',
    products,
    categories
  });

});

module.exports = router;