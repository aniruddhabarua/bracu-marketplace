const db = require('./config/db');

db.query(
  "INSERT INTO transaction_history (order_id, user_id, type, amount, created_at) SELECT order_id, buyer_id, 'purchase', agreed_price, created_at FROM orders WHERE order_id NOT IN (SELECT order_id FROM transaction_history WHERE type='purchase')",
  (err) => {
    if (err) console.error(err);
    db.query(
      "INSERT INTO transaction_history (order_id, user_id, type, amount, created_at) SELECT order_id, seller_id, 'sale', agreed_price, created_at FROM orders WHERE order_id NOT IN (SELECT order_id FROM transaction_history WHERE type='sale')",
      (err2) => {
        if (err2) console.error(err2);
        console.log("Done");
        process.exit();
      }
    );
  }
);
