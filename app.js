var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var priceRouter = require('./routes/price');
var ordersRouter = require('./routes/orders');
var accountStatementRouter = require('./routes/account-statement');
var accountStatementDetailRouter = require('./routes/account-statement-detail');

var app = express();

require('dotenv').config();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  var connectKey = req.header('Connect-Key');

  if (!connectKey || connectKey !== process.env.CONNECT_KEY) {
    return res.sendStatus(401);
  }

  next();
});

app.use('/', indexRouter);
app.use('/price', priceRouter);
app.use('/orders', ordersRouter);
app.use('/account-statement', accountStatementRouter);
app.use('/account-statement/detail', accountStatementDetailRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
