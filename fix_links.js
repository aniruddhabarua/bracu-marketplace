const db = require('./config/db');

db.query(
  "UPDATE notifications SET link = '/transactions' WHERE link LIKE '%orders.html%'",
  (err, result) => {
    if (err) console.error(err);
    console.log("Updated rows:", result.affectedRows);
    process.exit();
  }
);
