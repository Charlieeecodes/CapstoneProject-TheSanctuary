CREATE DATABASE IF NOT EXISTS sanctuary_inquiry_system;
USE sanctuary_inquiry_system;

CREATE TABLE inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  subject VARCHAR(150),
  message TEXT,
  status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE inquiries
ADD COLUMN status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending';

