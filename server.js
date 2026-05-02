require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');
const fs         = require('fs');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

const userRoutes           = require('./routes/userRoutes');
const productRoutes        = require('./routes/productRoutes');
const listingRoutes        = require('./routes/listingRoutes');
const similarProductsRoutes = require('./routes/similarProductsRoutes');
const notificationRoutes   = require('./routes/notificationRoutes');
const paymentRoutes        = require('./routes/paymentRoutes');
const transactionRoutes    = require('./routes/transactionRoutes');
const reportRoutes         = require('./routes/reportRoutes');
const wishlistRoutes       = require('./routes/wishlistRoutes');
const favoriteSellersRoutes = require('./routes/favoriteSellersRoutes');
const chatRoutes           = require('./routes/chatRoutes');
const ratingRoutes         = require('./routes/ratingRoutes');
const recentlyViewedRoutes = require('./routes/recentlyViewedRoutes');
const announcementRoutes   = require('./routes/announcementRoutes');
const adminRoutes          = require('./routes/adminRoutes');  // <-- ADD THIS LINE

const uploadDir = path.join(__dirname, 'public', 'uploads', 'listings');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/',                   userRoutes);
app.use('/',                   productRoutes);
app.use('/api/listings',       listingRoutes);
app.use('/api/listings',       similarProductsRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/payments',       paymentRoutes);
app.use('/api/transactions',   transactionRoutes);
app.use('/api/reports',        reportRoutes);
app.use('/api/wishlist',       wishlistRoutes);
app.use('/api/favorite-sellers', favoriteSellersRoutes);
app.use('/api/chat',           chatRoutes);
app.use('/api/ratings',        ratingRoutes);
app.use('/api/recently-viewed', recentlyViewedRoutes);
app.use('/api/announcements',   announcementRoutes);
app.use('/api',                 adminRoutes);  // <-- ADD THIS LINE

app.get('/',              (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login',         (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/login.html',    (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/sell',          (req, res) => res.sendFile(path.join(__dirname, 'views', 'sell.html')));
app.get('/profile',       (req, res) => res.sendFile(path.join(__dirname, 'views', 'profile.html')));
app.get('/wishlist',      (req, res) => res.sendFile(path.join(__dirname, 'views', 'wishlist.html')));
app.get('/listings',      (req, res) => res.sendFile(path.join(__dirname, 'views', 'listings.html')));
app.get('/notifications', (req, res) => res.sendFile(path.join(__dirname, 'views', 'notifications.html')));
app.get('/transactions',  (req, res) => res.sendFile(path.join(__dirname, 'views', 'transactions.html')));
app.get('/checkout',      (req, res) => res.sendFile(path.join(__dirname, 'views', 'checkout.html')));
app.get('/admin',         (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/admin.html',    (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

require('./socket')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

module.exports = app;
