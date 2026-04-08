const db = require('../config/db');

const UserModel = {
  /**
   * Find user by username
   */
  async findByUsername(username) {
    const [rows] = await db.query(
      'SELECT * FROM `USER` WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM `USER` WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Find user by ID
   */
  async findById(userID) {
    const [rows] = await db.query(
      'SELECT userID, username, email, role, registrationDate, accountStatus FROM `USER` WHERE userID = ?',
      [userID]
    );
    return rows[0] || null;
  },

  /**
   * Create a new user
   */
  async create({ username, email, password, role = 'user' }) {
    const [result] = await db.query(
      'INSERT INTO `USER` (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, password, role]
    );
    return result.insertId;
  }
};

module.exports = UserModel;
