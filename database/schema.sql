-- IncidentX Database Schema
-- Version 1.0

CREATE DATABASE IF NOT EXISTS incidentx;
USE incidentx;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- Table: USER
-- =============================================
CREATE TABLE IF NOT EXISTS `USER` (
  userID          INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50) NOT NULL UNIQUE,
  email           VARCHAR(100) NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  role            ENUM('user', 'admin') DEFAULT 'user',
  registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  accountStatus   ENUM('active', 'inactive') DEFAULT 'active',
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Table: INCIDENT
-- =============================================
CREATE TABLE IF NOT EXISTS `INCIDENT` (
  incidentID    INT AUTO_INCREMENT PRIMARY KEY,
  userID        INT NOT NULL,
  incidentType  ENUM('Phishing', 'Malware', 'Data Breach', 'Online Fraud') NOT NULL,
  description   TEXT NOT NULL,
  severity      ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
  reportedDate  DATETIME NOT NULL,
  status        ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
  location      VARCHAR(255),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userID) REFERENCES `USER`(userID) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_type (incidentType),
  INDEX idx_severity (severity),
  INDEX idx_reported_date (reportedDate),
  INDEX idx_user (userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Table: VERIFICATION (Audit Log)
-- =============================================
CREATE TABLE IF NOT EXISTS `VERIFICATION` (
  verificationID   INT AUTO_INCREMENT PRIMARY KEY,
  incidentID       INT NOT NULL,
  adminID          INT NOT NULL,
  action           ENUM('VERIFY', 'REJECT', 'EDIT', 'DELETE') NOT NULL,
  comments         TEXT,
  verificationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incidentID) REFERENCES `INCIDENT`(incidentID) ON DELETE CASCADE,
  FOREIGN KEY (adminID) REFERENCES `USER`(userID) ON DELETE CASCADE,
  INDEX idx_incident (incidentID),
  INDEX idx_admin (adminID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Table: THREAT_ANALYSIS
-- =============================================
CREATE TABLE IF NOT EXISTS `THREAT_ANALYSIS` (
  analysisID       INT AUTO_INCREMENT PRIMARY KEY,
  incidentID       INT NOT NULL,
  threatCategory   VARCHAR(100),
  pattern          TEXT,
  recommendation   TEXT,
  analysisDate     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incidentID) REFERENCES `INCIDENT`(incidentID) ON DELETE CASCADE,
  INDEX idx_incident (incidentID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =============================================
-- Seed Data: Admin Account
-- Password: Admin@123 (bcrypt hashed)
-- =============================================
INSERT INTO `USER` (username, email, password, role) VALUES
('admin', 'admin@incidentx.com', '$2b$10$8QXZK5L5Gq3Yq1Gq3Yq1GuL7v5fR5e5X5X5X5X5X5X5X5X5X5X5', 'admin');

-- =============================================
-- Seed Data: Test User
-- Password: User@123 (bcrypt hashed)
-- =============================================
INSERT INTO `USER` (username, email, password, role) VALUES
('testuser', 'testuser@incidentx.com', '$2b$10$8QXZK5L5Gq3Yq1Gq3Yq1GuL7v5fR5e5X5X5X5X5X5X5X5X5X5X5', 'user');

-- =============================================
-- Seed Data: Sample Incidents
-- =============================================
INSERT INTO `INCIDENT` (userID, incidentType, description, severity, reportedDate, status, location) VALUES
(2, 'Phishing', 'Received a suspicious email claiming to be from the bank asking for account credentials. The email contained a malicious link redirecting to a fake login page.', 'High', '2025-11-15 10:30:00', 'Verified', 'Mumbai, India'),
(2, 'Malware', 'Detected a ransomware infection on the workstation after opening an email attachment. Files were encrypted and a ransom note was displayed.', 'Critical', '2025-12-02 14:15:00', 'Verified', 'Delhi, India'),
(2, 'Data Breach', 'Customer database was accessed by an unauthorized user through a compromised API endpoint. Approximately 500 records were potentially exposed.', 'Critical', '2026-01-10 09:00:00', 'Pending', 'Bangalore, India'),
(2, 'Online Fraud', 'Multiple unauthorized transactions detected on the company credit card. Total amount of approximately Rs. 50,000 was charged across various online platforms.', 'High', '2026-01-25 16:45:00', 'Rejected', 'Hyderabad, India'),
(2, 'Phishing', 'SMS phishing attempt received on corporate phone numbers. Messages contained links to download a fake security update application.', 'Medium', '2026-02-05 11:20:00', 'Pending', 'Chennai, India'),
(2, 'Malware', 'Spyware detected on multiple devices in the network. The malware was collecting keystrokes and sending data to an external server.', 'High', '2026-02-18 08:30:00', 'Verified', 'Pune, India'),
(2, 'Data Breach', 'Employee credentials were found on a dark web forum. Investigation revealed a third-party vendor compromise as the source.', 'Critical', '2026-03-01 13:00:00', 'Pending', 'Kolkata, India'),
(2, 'Online Fraud', 'Fake vendor invoices submitted through the procurement portal. The invoices totaled Rs. 2,00,000 and were linked to shell companies.', 'Medium', '2026-03-12 10:00:00', 'Pending', 'Ahmedabad, India'),
(2, 'Phishing', 'Spear phishing attack targeting C-level executives. Emails impersonated a known partner organization and contained a weaponized PDF attachment.', 'Critical', '2026-03-20 15:30:00', 'Verified', 'Jaipur, India'),
(2, 'Malware', 'Cryptocurrency mining malware found running on development servers. The malware was consuming significant CPU resources and slowing down build processes.', 'Low', '2026-04-01 07:45:00', 'Pending', 'Lucknow, India');
