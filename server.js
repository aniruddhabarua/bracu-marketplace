const express = require('express');
const path    = require('path');
const fs      = require('fs');
const app     = express();


const userRoutes         = require('./routes/userRoutes');
const productRoutes      = require('./routes/productRoutes');
const listingRoutes      = require('./routes/listingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes      = require('./routes/paymentRoutes');
const reportRoutes       = require('./routes/reportRoutes');
const wishlistRoutes     = require('./routes/wishlistRoutes');

const uploadDir = path.join(__dirname, 'public', 'uploads', 'listings');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/',                  userRoutes);
app.use('/',                  productRoutes);
app.use('/api/listings',      listingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/wishlist',      wishlistRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/sell', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'sell.html'));
});

app.get('/listings', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'listings.html'));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${3000}`);
});

module.exports = app;