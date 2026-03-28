
const mysql = require('mysql2');

const pool = mysql.createPool({
  host:     'localhost',
  user:     'root',
  password: '',      
  database: 'bracu_marketplace',
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