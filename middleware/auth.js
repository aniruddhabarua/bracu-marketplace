const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bracu_marketplace_secret_key';


const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; 

  if (!token)
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ success: false, message: 'Invalid or expired token.' });

    req.user = decoded; 
    next();
  });
};


const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1];

  if (!token) return next(); 

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err) req.user = decoded;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  next();
};

module.exports = { authenticate, optionalAuth, requireAdmin, JWT_SECRET };