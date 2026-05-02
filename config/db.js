
const mysql = require('mysql2');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',      
  database: process.env.DB_NAME || 'bracu_marketplace',
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 0,
});


pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL database: bracu_marketplace');
  connection.release();
});

module.exports = pool;