const db = require('./config/db');
db.query('SHOW TABLES', (e, r) => {
  console.log('Tables:', r.map(row => Object.values(row)[0]));
  process.exit();
});
