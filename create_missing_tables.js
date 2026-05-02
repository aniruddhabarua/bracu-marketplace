const db = require('./config/db');

const queries = [
  `CREATE TABLE IF NOT EXISTS recently_viewed (
    view_id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11) NOT NULL,
    listing_id int(11) NOT NULL,
    viewed_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (view_id),
    UNIQUE KEY uq_recently_viewed (user_id, listing_id),
    KEY listing_id (listing_id),
    KEY idx_recently_viewed_user (user_id),
    KEY idx_recently_viewed_time (viewed_at),
    CONSTRAINT recently_viewed_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT recently_viewed_ibfk_2 FOREIGN KEY (listing_id) REFERENCES listings (listing_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS favorite_sellers (
    favorite_id int(11) NOT NULL AUTO_INCREMENT,
    user_id int(11) NOT NULL,
    seller_id int(11) NOT NULL,
    followed_at datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (favorite_id),
    UNIQUE KEY uq_favorite_sellers (user_id, seller_id),
    KEY idx_favorite_sellers_user (user_id),
    KEY idx_favorite_sellers_seller (seller_id),
    CONSTRAINT favorite_sellers_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT favorite_sellers_ibfk_2 FOREIGN KEY (seller_id) REFERENCES users (user_id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

let done = 0;
queries.forEach((sql, i) => {
  db.query(sql, (err) => {
    if (err) console.error(`Query ${i} error:`, err.message);
    else console.log(`Query ${i} done`);
    if (++done === queries.length) process.exit();
  });
});
