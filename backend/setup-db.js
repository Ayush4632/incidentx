/**
 * Database Setup Script
 * Run with: node setup-db.js
 * Creates the database and tables, seeds initial data
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupDatabase() {
  // Connect without specifying database
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'incidentx'
  });

  console.log('🔌 Connected to MySQL Database:', process.env.DB_NAME || 'incidentx');

  // Create USER table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`USER\` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Table USER created');

  // Create INCIDENT table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS INCIDENT (
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
      FOREIGN KEY (userID) REFERENCES \`USER\`(userID) ON DELETE CASCADE,
      INDEX idx_status (status),
      INDEX idx_type (incidentType),
      INDEX idx_severity (severity),
      INDEX idx_reported_date (reportedDate),
      INDEX idx_user (userID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Table INCIDENT created');

  // Create VERIFICATION table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS VERIFICATION (
      verificationID   INT AUTO_INCREMENT PRIMARY KEY,
      incidentID       INT NOT NULL,
      adminID          INT NOT NULL,
      action           ENUM('VERIFY', 'REJECT', 'EDIT', 'DELETE') NOT NULL,
      comments         TEXT,
      verificationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incidentID) REFERENCES INCIDENT(incidentID) ON DELETE CASCADE,
      FOREIGN KEY (adminID) REFERENCES \`USER\`(userID) ON DELETE CASCADE,
      INDEX idx_incident (incidentID),
      INDEX idx_admin (adminID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Table VERIFICATION created');

  // Create THREAT_ANALYSIS table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS THREAT_ANALYSIS (
      analysisID       INT AUTO_INCREMENT PRIMARY KEY,
      incidentID       INT NOT NULL,
      threatCategory   VARCHAR(100),
      pattern          TEXT,
      recommendation   TEXT,
      analysisDate     DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incidentID) REFERENCES INCIDENT(incidentID) ON DELETE CASCADE,
      INDEX idx_ta_incident (incidentID)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('✅ Table THREAT_ANALYSIS created');

  // Seed admin account
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  try {
    await conn.query(
      'INSERT INTO `USER` (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@incidentx.com', adminPassword, 'admin']
    );
    console.log('👤 Admin account created (admin / Admin@123)');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      console.log('👤 Admin account already exists');
    } else throw e;
  }

  // Seed multiple test users
  const userPassword = await bcrypt.hash('User@123', 10);
  const testUsers = [
    ['Aryan', 'aryan@incidentx.com'],
    ['Prateek', 'prateek@incidentx.com'],
    ['Shyam', 'shyam@incidentx.com'],
    ['Raju', 'raju@incidentx.com'],
    ['Meera', 'meera@incidentx.com']
  ];

  const userIDs = {};
  for (const [name, email] of testUsers) {
    try {
      const [result] = await conn.query(
        'INSERT INTO `USER` (username, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, userPassword, 'user']
      );
      userIDs[name] = result.insertId;
      console.log('👤 User created (' + name + ' / User@123)');
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        const [rows] = await conn.query('SELECT userID FROM `USER` WHERE username = ?', [name]);
        userIDs[name] = rows[0].userID;
        console.log('👤 User ' + name + ' already exists');
      } else throw e;
    }
  }

  // Seed sample incidents — distributed across different users
  const [existing] = await conn.query('SELECT COUNT(*) as count FROM INCIDENT');
  if (existing[0].count === 0) {
    const incidents = [
      [userIDs['Aryan'], 'Phishing', 'Received a suspicious email claiming to be from the bank asking for account credentials. The email contained a malicious link redirecting to a fake login page.', 'High', '2025-11-15 10:30:00', 'Verified', 'Mumbai, India'],
      [userIDs['Prateek'], 'Malware', 'Detected a ransomware infection on the workstation after opening an email attachment. Files were encrypted and a ransom note was displayed on the desktop.', 'Critical', '2025-12-02 14:15:00', 'Verified', 'Delhi, India'],
      [userIDs['Shyam'], 'Data Breach', 'Customer database was accessed by an unauthorized user through a compromised API endpoint. Approximately 500 records were potentially exposed.', 'Critical', '2026-01-10 09:00:00', 'Pending', 'Bangalore, India'],
      [userIDs['Raju'], 'Online Fraud', 'Multiple unauthorized transactions detected on the company credit card. Total amount of approximately Rs. 50,000 was charged across various online platforms.', 'High', '2026-01-25 16:45:00', 'Rejected', 'Hyderabad, India'],
      [userIDs['Meera'], 'Phishing', 'SMS phishing attempt received on corporate phone numbers. Messages contained links to download a fake security update application masquerading as a legitimate service.', 'Medium', '2026-02-05 11:20:00', 'Pending', 'Chennai, India'],
      [userIDs['Aryan'], 'Malware', 'Spyware detected on multiple devices in the network. The malware was collecting keystrokes and screenshots then sending data to an external command server.', 'High', '2026-02-18 08:30:00', 'Verified', 'Pune, India'],
      [userIDs['Prateek'], 'Data Breach', 'Employee credentials were found on a dark web forum. Investigation revealed a third-party vendor compromise as the source of the data leak.', 'Critical', '2026-03-01 13:00:00', 'Pending', 'Kolkata, India'],
      [userIDs['Shyam'], 'Online Fraud', 'Fake vendor invoices submitted through the procurement portal. The invoices totaled Rs. 2,00,000 and were linked to shell companies registered under false identities.', 'Medium', '2026-03-12 10:00:00', 'Pending', 'Ahmedabad, India'],
      [userIDs['Raju'], 'Phishing', 'Spear phishing attack targeting C-level executives. Emails impersonated a known partner organization and contained a weaponized PDF document with embedded macro code.', 'Critical', '2026-03-20 15:30:00', 'Verified', 'Jaipur, India'],
      [userIDs['Meera'], 'Malware', 'Cryptocurrency mining malware found running on development servers. The malware was consuming significant CPU resources and slowing down all build processes.', 'Low', '2026-04-01 07:45:00', 'Pending', 'Lucknow, India']
    ];

    for (const inc of incidents) {
      await conn.query(
        'INSERT INTO INCIDENT (userID, incidentType, description, severity, reportedDate, status, location) VALUES (?, ?, ?, ?, ?, ?, ?)',
        inc
      );
    }
    console.log('📋 ' + incidents.length + ' sample incidents seeded across 5 users');
  } else {
    console.log('📋 Incidents already exist, skipping seed');
  }

  await conn.end();
  console.log('\n🎉 Database setup complete!\n');
  console.log('Default accounts:');
  console.log('  Admin   → username: admin, password: Admin@123');
  console.log('  Users   → Aryan, Prateek, Shyam, Raju, Meera (password: User@123 for all)');
}

setupDatabase().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
