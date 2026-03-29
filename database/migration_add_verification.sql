-- Migration: Add seller verification status
-- Run this to add verification badge feature to sellers

ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active;

-- Mark faculty and staff as verified by default (optional)
UPDATE users SET is_verified = 1 WHERE role IN ('faculty', 'staff', 'admin');

-- Add index for faster queries
CREATE INDEX idx_users_verified ON users(is_verified);
