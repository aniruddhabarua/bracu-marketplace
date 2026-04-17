-- ============================================================
--  BRACU Marketplace — Full Database Schema
--  Import via phpMyAdmin: Import > select this file > Go
--  Or via MySQL CLI: mysql -u root -p < bracu_marketplace.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS bracu_marketplace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bracu_marketplace;

-- ------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id         INT           NOT NULL AUTO_INCREMENT,
  full_name       VARCHAR(100)  NOT NULL,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  role            ENUM('student','faculty','staff','alumni','admin')
                                NOT NULL DEFAULT 'student',
  department      VARCHAR(100)  DEFAULT NULL,
  profile_picture VARCHAR(255)  DEFAULT NULL,
  bio             TEXT          DEFAULT NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  is_verified     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  INDEX idx_users_email (email),
  INDEX idx_users_verified (is_verified)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. LISTINGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listings (
  listing_id      INT             NOT NULL AUTO_INCREMENT,
  seller_id       INT             NOT NULL,
  title           VARCHAR(100)    NOT NULL,
  description     TEXT            NOT NULL,
  price           DECIMAL(10,2)   NOT NULL,
  category        ENUM(
                    'Books & Notes',
                    'Electronics',
                    'Clothing & Accessories',
                    'Stationery & Supplies',
                    'Sports & Fitness',
                    'Food & Beverages',
                    'Furniture & Decor',
                    'Services',
                    'Other'
                  ) NOT NULL,
  condition_type  ENUM('new','like_new','good','fair','poor') NOT NULL,
  location        VARCHAR(150)    DEFAULT NULL,
  status          ENUM('available','reserved','sold','removed')
                                  NOT NULL DEFAULT 'available',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (listing_id),
  FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_listings_seller   (seller_id),
  INDEX idx_listings_status   (status),
  INDEX idx_listings_category (category)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. LISTING IMAGES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS listing_images (
  image_id    INT          NOT NULL AUTO_INCREMENT,
  listing_id  INT          NOT NULL,
  image_url   VARCHAR(255) NOT NULL,
  is_primary  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (image_id),
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
  INDEX idx_listing_images_listing (listing_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. ORDERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id        INT           NOT NULL AUTO_INCREMENT,
  listing_id      INT           NOT NULL,
  buyer_id        INT           NOT NULL,
  seller_id       INT           NOT NULL,
  agreed_price    DECIMAL(10,2) NOT NULL,
  payment_method  ENUM('online','offline','bkash','nagad','rocket','bank')
                                NOT NULL,
  payment_status  ENUM('pending','paid','failed','refunded')
                                NOT NULL DEFAULT 'pending',
  order_status    ENUM('pending','confirmed','completed','cancelled','disputed')
                                NOT NULL DEFAULT 'pending',
  notes           TEXT          DEFAULT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id),
  FOREIGN KEY (buyer_id)   REFERENCES users(user_id),
  FOREIGN KEY (seller_id)  REFERENCES users(user_id),
  INDEX idx_orders_buyer  (buyer_id),
  INDEX idx_orders_seller (seller_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. TRANSACTION HISTORY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_history (
  transaction_id  INT           NOT NULL AUTO_INCREMENT,
  order_id        INT           NOT NULL,
  user_id         INT           NOT NULL,
  type            ENUM('purchase','sale') NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (transaction_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(user_id)   ON DELETE CASCADE,
  INDEX idx_txn_user (user_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. CONVERSATIONS (Chat)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id  INT      NOT NULL AUTO_INCREMENT,
  buyer_id         INT      NOT NULL,
  seller_id        INT      NOT NULL,
  listing_id       INT      DEFAULT NULL,
  last_message_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id),
  FOREIGN KEY (buyer_id)  REFERENCES users(user_id)    ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(user_id)    ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE SET NULL,
  -- prevent duplicate conversations for the same pair + listing
  UNIQUE KEY uq_conversation (buyer_id, seller_id, listing_id),
  INDEX idx_conv_buyer  (buyer_id),
  INDEX idx_conv_seller (seller_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. MESSAGES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  message_id       INT          NOT NULL AUTO_INCREMENT,
  conversation_id  INT          NOT NULL,
  sender_id        INT          NOT NULL,
  content          TEXT         NOT NULL,
  is_read          TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (message_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)       REFERENCES users(user_id)                 ON DELETE CASCADE,
  INDEX idx_messages_conversation (conversation_id),
  INDEX idx_messages_sender       (sender_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. NOTIFICATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  notification_id  INT          NOT NULL AUTO_INCREMENT,
  user_id          INT          NOT NULL,
  type             ENUM('message','order','payment','review','report','system')
                                NOT NULL,
  title            VARCHAR(150) NOT NULL,
  body             TEXT         NOT NULL,
  link             VARCHAR(255) DEFAULT NULL,
  is_read          TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (notification_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. WISHLIST
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist (
  wishlist_id  INT      NOT NULL AUTO_INCREMENT,
  user_id      INT      NOT NULL,
  listing_id   INT      NOT NULL,
  added_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (wishlist_id),
  UNIQUE KEY uq_wishlist (user_id, listing_id),
  FOREIGN KEY (user_id)    REFERENCES users(user_id)    ON DELETE CASCADE,
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id) ON DELETE CASCADE,
  INDEX idx_wishlist_user (user_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 10. REPORTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  report_id      INT          NOT NULL AUTO_INCREMENT,
  reporter_id    INT          NOT NULL,
  reported_type  ENUM('listing','user','message') NOT NULL,
  reported_id    INT          NOT NULL,
  reason         VARCHAR(100) NOT NULL,
  details        TEXT         DEFAULT NULL,
  status         ENUM('pending','reviewed','resolved','dismissed')
                              NOT NULL DEFAULT 'pending',
  admin_note     TEXT         DEFAULT NULL,
  resolved_at    DATETIME     DEFAULT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_reports_reporter (reporter_id),
  INDEX idx_reports_status   (status)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 11. REVIEWS  (for rating sellers — referenced in userModels)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  review_id   INT        NOT NULL AUTO_INCREMENT,
  reviewer_id INT        NOT NULL,
  seller_id   INT        NOT NULL,
  listing_id  INT        DEFAULT NULL,
  rating      TINYINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT       DEFAULT NULL,
  created_at  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (listing_id)  REFERENCES listings(listing_id) ON DELETE SET NULL,
  INDEX idx_reviews_seller (seller_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 12. FAVORITE SELLERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorite_sellers (
  favorite_id  INT      NOT NULL AUTO_INCREMENT,
  user_id      INT      NOT NULL,
  seller_id    INT      NOT NULL,
  followed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (favorite_id),
  UNIQUE KEY uq_favorite_seller (user_id, seller_id),
  FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_favorite_user (user_id),
  INDEX idx_favorite_seller (seller_id)
) ENGINE=InnoDB;

-- ============================================================
--  SAMPLE DATA — safe to delete before production
--  All passwords are: admin123
-- ============================================================

-- NOTE: is_verified is already set per-user in the INSERT below.
-- Faculty, staff, and admin are verified by default (from migration_add_verification.sql).
-- Students start unverified (is_verified = 0).

INSERT INTO users (full_name, email, password_hash, role, department, is_verified) VALUES
('Admin User',    'admin@bracu.ac.bd',  '$2b$10$zgj9BB.B9Hc7lnP9MO/F1OUJkHWg4sC9RDMvgwiMc9ljaxyr9N9eC', 'admin',   'Administration', 1),
('Alice Student', 'alice@bracu.ac.bd',  '$2b$10$zgj9BB.B9Hc7lnP9MO/F1OUJkHWg4sC9RDMvgwiMc9ljaxyr9N9eC', 'student', 'CSE',            0),
('Bob Student',   'bob@bracu.ac.bd',    '$2b$10$zgj9BB.B9Hc7lnP9MO/F1OUJkHWg4sC9RDMvgwiMc9ljaxyr9N9eC', 'student', 'EEE',            0),
('Carol Faculty', 'carol@bracu.ac.bd',  '$2b$10$zgj9BB.B9Hc7lnP9MO/F1OUJkHWg4sC9RDMvgwiMc9ljaxyr9N9eC', 'faculty', 'Mathematics',    1);

-- Sample listings
INSERT INTO listings (seller_id, title, description, price, category, condition_type, location, status) VALUES
(2, 'Calculus Textbook',      'Essential calculus book, 3rd edition. Very good condition.', 450.00, 'Books & Notes',    'good',     'BRACU Campus', 'available'),
(2, 'Scientific Calculator',  'Casio fx-991EX. Works perfectly.',                           850.00, 'Electronics',      'like_new',  'BRACU Campus', 'available'),
(3, 'Physics Lab Manual',     'Complete lab manual for PHY101.',                            200.00, 'Books & Notes',    'fair',      'Dhaka',        'available'),
(3, 'Laptop Stand',           'Adjustable aluminum laptop stand.',                          600.00, 'Furniture & Decor','new',       'BRACU Campus', 'available');

-- Primary images for sample listings (placeholder paths)
INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES
(1, '/uploads/listings/sample_book.jpg',       1),
(2, '/uploads/listings/sample_calculator.jpg', 1),
(3, '/uploads/listings/sample_manual.jpg',     1),
(4, '/uploads/listings/sample_stand.jpg',      1);

-- ============================================================
--  MIGRATION: Email Verification (merged from migration_add_verification.sql)
--  Safe to run on existing databases that predate is_verified.
--  If you imported this full schema fresh, this section sets up OTP verification.
-- ============================================================

-- STEP 1: Ensure is_verified column exists on users table
ALTER TABLE users
  MODIFY COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '0 = email not verified, 1 = email verified';

-- STEP 2: Create the otp_verifications table
--         Stores 6-digit OTP codes sent to users during registration
CREATE TABLE IF NOT EXISTS otp_verifications (
  otp_id      INT           NOT NULL AUTO_INCREMENT,
  user_id     INT           NOT NULL,
  otp_code    VARCHAR(10)   NOT NULL,
  expires_at  DATETIME      NOT NULL,
  is_used     TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (otp_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_otp_user    (user_id),
  INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT 'Stores one-time passwords for email verification';

-- STEP 3: Mark faculty, staff, and admin as already verified
UPDATE users
SET is_verified = 1
WHERE role IN ('faculty', 'staff', 'admin')
  AND is_verified = 0;

-- STEP 4: Clean up expired or used OTPs automatically
DROP EVENT IF EXISTS cleanup_expired_otps;

CREATE EVENT cleanup_expired_otps
  ON SCHEDULE EVERY 1 HOUR
  DO
    DELETE FROM otp_verifications
    WHERE expires_at < NOW() OR is_used = 1;

-- ============================================================
--  Verification migration complete.
--  New table created : otp_verifications
--  Column confirmed  : users.is_verified
--  Auto-verified     : faculty, staff, admin roles
--  Event created     : cleanup_expired_otps (runs hourly)
-- ============================================================
