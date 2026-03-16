const express = require('express');
const path    = require('path');
const app     = express();
const userRoutes    = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', userRoutes);
app.use('/', productRoutes);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

//server init
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
