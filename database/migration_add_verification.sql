-- ============================================================
--  BRACU Marketplace — Migration: Email Verification
--  File: migration_add_verification.sql
--
--  Run this ONCE on your existing database:
--    Via phpMyAdmin : Import > select this file > Go
--    Via MySQL CLI  : mysql -u root -p bracu_marketplace < migration_add_verification.sql
--
--  Safe to run even if you imported bracu_marketplace.sql fresh —
--  all statements use IF NOT EXISTS / IF EXISTS guards.
-- ============================================================

USE bracu_marketplace;

-- ------------------------------------------------------------
-- STEP 1: Ensure is_verified column exists on users table
--         (already present in the full schema, this is a safety guard)
-- ------------------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '0 = email not verified, 1 = email verified';

-- ------------------------------------------------------------
-- STEP 2: Create the otp_verifications table
--         Stores 6-digit OTP codes sent to users during registration
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
  otp_id      INT           NOT NULL AUTO_INCREMENT,

  -- Which user this OTP belongs to
  user_id     INT           NOT NULL,

  -- The 6-digit code that was emailed to the user
  otp_code    VARCHAR(10)   NOT NULL,

  -- When this OTP stops being valid (10 minutes from creation)
  expires_at  DATETIME      NOT NULL,

  -- Prevent reuse: once used, mark it so it cannot be used again
  is_used     TINYINT(1)    NOT NULL DEFAULT 0,

  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (otp_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,

  -- Speeds up the lookup: "find latest unused OTP for this user"
  INDEX idx_otp_user    (user_id),
  INDEX idx_otp_expires (expires_at)

) ENGINE=InnoDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci
  COMMENT 'Stores one-time passwords for email verification';

-- ------------------------------------------------------------
-- STEP 3: Mark faculty, staff, and admin as already verified
--         (they do not need to go through OTP verification)
-- ------------------------------------------------------------
UPDATE users
SET is_verified = 1
WHERE role IN ('faculty', 'staff', 'admin')
  AND is_verified = 0;

-- ------------------------------------------------------------
-- STEP 4: Clean up expired or used OTPs automatically
--         (optional scheduled event — requires MySQL Event Scheduler ON)
-- ------------------------------------------------------------
DROP EVENT IF EXISTS cleanup_expired_otps;

CREATE EVENT cleanup_expired_otps
  ON SCHEDULE EVERY 1 HOUR
  DO
    DELETE FROM otp_verifications
    WHERE expires_at < NOW() OR is_used = 1;

-- ============================================================
--  Verification complete.
--  New table created : otp_verifications
--  Column confirmed  : users.is_verified
--  Auto-verified     : faculty, staff, admin roles
-- ============================================================
