const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: 'server/config/config.env' });
}

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3002',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const user = require('./routes/userRoute');
const product = require('./routes/productRoute');
const order = require('./routes/orderRoute');
const payment = require('./routes/paymentRoute');

app.use('/api/user', user);
app.use('/api/product', product);
app.use('/api/order', order);
app.use('/api/payment', payment);

if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => res.json({ status: 'ok' }));
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
} else {
  app.get('/', (req, res) => {
    res.send('Server is Running! 🚀');
  });
}

module.exports = app;
