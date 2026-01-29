-- =====================================================
-- DUMMY DATA FOR AUTH SYSTEM
-- Run this SQL in your database to create test accounts
-- =====================================================

-- NOTE: All passwords are bcrypt hashed (12 salt rounds)
-- You can use these credentials to test login

-- =====================================================
-- CREATE TABLES (IF NOT EXISTS)
-- =====================================================

CREATE TABLE IF NOT EXISTS business_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  slug VARCHAR(255) UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  logo LONGTEXT,
  theme JSON,
  header_config JSON,
  footer_config JSON,
  platforms JSON,
  language_pref VARCHAR(50) DEFAULT 'English',
  prompt_config JSON,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  google_maps_link TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user (user_id)
);

-- Note: heavily depends on JSON columns which are supported in MySQL 5.7+
-- If using older MySQL, these should be TEXT

-- =====================================================
-- ADMIN ACCOUNT (1 admin)
-- =====================================================
