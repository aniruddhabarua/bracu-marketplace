const mysql = require('mysql2');
const pool = mysql.createPool({
  host:     'localhost',
  user:     'root',
  password: '',      
  database: 'bracu_marketplace',
});

const sql = `
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id int(11) NOT NULL AUTO_INCREMENT,
  admin_id int(11) NOT NULL,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  category enum('Announcement', 'Rule', 'Update') NOT NULL DEFAULT 'Announcement',
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (announcement_id),
  CONSTRAINT announcements_ibfk_1 FOREIGN KEY (admin_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

pool.query(sql, (err, result) => {
  if (err) {
    console.error('Error creating table:', err);
    process.exit(1);
  }
  console.log('Announcements table created successfully.');
  process.exit(0);
});
