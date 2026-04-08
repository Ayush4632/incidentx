const db = require('../config/db');

const VerificationModel = {
  /**
   * Log an admin action to the audit trail
   */
  async logAction({ incidentID, adminID, action, comments }) {
    const [result] = await db.query(
      `INSERT INTO VERIFICATION (incidentID, adminID, action, comments)
       VALUES (?, ?, ?, ?)`,
      [incidentID, adminID, action, comments || null]
    );
    return result.insertId;
  },

  /**
   * Get verification history for an incident
   */
  async getByIncidentId(incidentID) {
    const [rows] = await db.query(
      `SELECT v.*, u.username as adminUsername
       FROM VERIFICATION v
       JOIN \`USER\` u ON v.adminID = u.userID
       WHERE v.incidentID = ?
       ORDER BY v.verificationDate DESC`,
      [incidentID]
    );
    return rows;
  }
};

module.exports = VerificationModel;
