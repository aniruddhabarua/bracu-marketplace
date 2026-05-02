const db = require('./config/db');

db.query(
  "UPDATE announcements SET content = 'The item \"Laptop\" was just purchased from Naofel!' WHERE title = '🎉 Exciting News! Item Sold!'",
  (err, result) => {
    if (err) console.error(err);
    console.log("Updated rows:", result ? result.affectedRows : 0);
    process.exit();
  }
);
