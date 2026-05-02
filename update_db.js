const db = require('./config/db');

db.query(
  "ALTER TABLE orders MODIFY order_status ENUM('pending','confirmed','completed','cancelled','disputed','delivered','ordered') NOT NULL DEFAULT 'pending';",
  (err, result) => {
    if (err) {
      console.error("Error updating table:", err);
    } else {
      console.log("Table updated successfully!");
    }
    process.exit();
  }
);
