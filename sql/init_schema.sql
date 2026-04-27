-- Initialize schema for Flask routes in this project.
-- Run this file against your Railway MySQL database (database: railway).

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS User (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Restaurant (
  restaurant_id VARCHAR(32) PRIMARY KEY,
  owner_id INT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  price_range VARCHAR(50) NULL,
  cuisine_type VARCHAR(100) NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  cover TEXT NULL,
  county VARCHAR(50) NULL,
  district VARCHAR(50) NULL,
  station_name VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_restaurant_owner
    FOREIGN KEY (owner_id) REFERENCES User(user_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Favorite (
  user_id INT NOT NULL,
  restaurant_id VARCHAR(32) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, restaurant_id),
  CONSTRAINT fk_favorite_user
    FOREIGN KEY (user_id) REFERENCES User(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_favorite_restaurant
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  restaurant_id VARCHAR(32) NOT NULL,
  rating INT NOT NULL,
  comment TEXT NULL,
  review_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES User(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_restaurant
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Image (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id VARCHAR(32) NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_image_restaurant
    FOREIGN KEY (restaurant_id) REFERENCES Restaurant(restaurant_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
