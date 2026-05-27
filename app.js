var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var productRouter = require('./routes/products');
var cartRouter = require('./routes/cart');
var orderRouter = require('./routes/orders');
var profileRouter = require('./routes/profile');
var adminRouter = require('./routes/admin');
var sellerRouter = require('./routes/seller');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: 'sports_web_secret',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'public')));

/*
  Biến user dùng chung cho tất cả file .ejs
  Ví dụ trong view có thể dùng:
  <% if (user) { %>
*/
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/products', productRouter);
app.use('/cart', cartRouter);
app.use('/orders', orderRouter);
app.use('/profile', profileRouter);

/*
  Route admin:
  /admin/users
  /admin/products
*/
app.use('/admin', adminRouter);

/*
  Route seller:
  /seller/products
*/
app.use('/seller', sellerRouter);

// Bắt lỗi 404
app.use(function(req, res, next) {
  next(createError(404));
});

// Xử lý lỗi chung
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;