CREATE DATABASE IF NOT EXISTS sanctuary_inquiry_system;
USE sanctuary_inquiry_system;

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  subject VARCHAR(150),
  message TEXT,
  status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Records table (for client records feature)
CREATE TABLE IF NOT EXISTS records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  contact VARCHAR(50),
  address VARCHAR(255),
  service_availed VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending'
);
