
// server.js
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const path    = require('path');
const fs      = require('fs');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {          
  cors: { origin: '*' },
});

// ── Route imports ─────────────────────────────────────────────
const userRoutes         = require('./routes/userRoutes');
const productRoutes      = require('./routes/productRoutes');
const listingRoutes      = require('./routes/listingRoutes');
const chatRoutes         = require('./routes/chatRoutes'); 
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes      = require('./routes/paymentRoutes');
const reportRoutes       = require('./routes/reportRoutes');
const wishlistRoutes     = require('./routes/wishlistRoutes');
const ratingRoutes       = require('./routes/ratingRoutes'); 
const favoriteSellersRoutes = require('./routes/favoriteSellersRoutes'); 
const recentlyViewedRoutes = require('./routes/recentlyViewedRoutes');

const uploadDir = path.join(__dirname, 'public', 'uploads', 'listings');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


app.use((req, res, next) => {
  req.io = io;
  next();
});


app.use('/',                     userRoutes);
app.use('/',                     productRoutes);
app.use('/api/listings',         listingRoutes);
app.use('/api/chat',             chatRoutes);           
app.use('/api/notifications',    notificationRoutes);
app.use('/api/payments',         paymentRoutes);
app.use('/api/reports',          reportRoutes);
app.use('/api/wishlist',         wishlistRoutes);
app.use('/api/ratings',          ratingRoutes);
app.use('/api/favorite-sellers', favoriteSellersRoutes);


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/login',      (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/sell',       (req, res) => res.sendFile(path.join(__dirname, 'views', 'sell.html')));
app.get('/profile',    (req, res) => res.sendFile(path.join(__dirname, 'views', 'profile.html')));
app.get('/listings',   (req, res) => res.sendFile(path.join(__dirname, 'views', 'listings.html')));
app.get('/admin',      (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/user',       (req, res) => res.sendFile(path.join(__dirname, 'views', 'userProfile.html')));


require('./socket')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {  
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

module.exports = app;
