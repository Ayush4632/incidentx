const db = require('../config/db');

const IncidentModel = {
  /**
   * Create a new incident
   */
  async create({ userID, incidentType, description, severity, reportedDate, location }) {
    const [result] = await db.query(
      `INSERT INTO INCIDENT (userID, incidentType, description, severity, reportedDate, location, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [userID, incidentType, description, severity, reportedDate, location || null]
    );
    return result.insertId;
  },

  /**
   * Find all incidents with filters and pagination
   */
  async findAll({ page = 1, limit = 20, keyword, timeRange, type, severity }) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (i.description LIKE ? OR i.location LIKE ? OR i.incidentType LIKE ?)';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    if (timeRange && timeRange !== 'all') {
      const intervals = { '7d': 7, '30d': 30, '6m': 180 };
      const days = intervals[timeRange];
      if (days) {
        whereClause += ' AND i.reportedDate >= DATE_SUB(NOW(), INTERVAL ? DAY)';
        params.push(days);
      }
    }

    if (type && type !== 'All') {
      whereClause += ' AND i.incidentType = ?';
      params.push(type);
    }

    if (severity && severity !== 'All') {
      whereClause += ' AND i.severity = ?';
      params.push(severity);
    }

    // Get total count
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM INCIDENT i ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Get paginated results
    const offset = (page - 1) * limit;
    const [rows] = await db.query(
      `SELECT i.*, u.username
       FROM INCIDENT i
       JOIN \`USER\` u ON i.userID = u.userID
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    return {
      incidents: rows,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    };
  },

  /**
   * Find incidents by user ID
   */
  async findByUserId(userID) {
    const [rows] = await db.query(
      `SELECT * FROM INCIDENT WHERE userID = ? ORDER BY created_at DESC`,
      [userID]
    );
    return rows;
  },

  /**
   * Find a single incident by ID
   */
  async findById(incidentID) {
    const [rows] = await db.query(
      `SELECT i.*, u.username
       FROM INCIDENT i
       JOIN \`USER\` u ON i.userID = u.userID
       WHERE i.incidentID = ?`,
      [incidentID]
    );
    return rows[0] || null;
  },

  /**
   * Update incident status
   */
  async updateStatus(incidentID, status) {
    const [result] = await db.query(
      'UPDATE INCIDENT SET status = ? WHERE incidentID = ?',
      [status, incidentID]
    );
    return result.affectedRows;
  },

  /**
   * Update incident details
   */
  async update(incidentID, fields) {
    const updates = [];
    const params = [];

    if (fields.incidentType) { updates.push('incidentType = ?'); params.push(fields.incidentType); }
    if (fields.severity) { updates.push('severity = ?'); params.push(fields.severity); }
    if (fields.description) { updates.push('description = ?'); params.push(fields.description); }
    if (fields.location !== undefined) { updates.push('location = ?'); params.push(fields.location); }
    if (fields.reportedDate) { updates.push('reportedDate = ?'); params.push(fields.reportedDate); }

    if (updates.length === 0) return 0;

    params.push(incidentID);
    const [result] = await db.query(
      `UPDATE INCIDENT SET ${updates.join(', ')} WHERE incidentID = ?`,
      params
    );
    return result.affectedRows;
  },

  /**
   * Delete an incident
   */
  async delete(incidentID) {
    const [result] = await db.query(
      'DELETE FROM INCIDENT WHERE incidentID = ?',
      [incidentID]
    );
    return result.affectedRows;
  },

  /**
   * Get all incidents for admin with optional status filter + counts
   */
  async findAllAdmin({ status, page = 1, limit = 20 }) {
    let whereClause = '';
    const params = [];

    if (status && status !== 'All') {
      whereClause = 'WHERE i.status = ?';
      params.push(status);
    }

    // Get counts
    const [counts] = await db.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Verified' THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
       FROM INCIDENT`
    );

    // Get paginated results
    const offset = (page - 1) * limit;
    const [rows] = await db.query(
      `SELECT i.*, u.username
       FROM INCIDENT i
       JOIN \`USER\` u ON i.userID = u.userID
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const total = status && status !== 'All'
      ? rows.length
      : counts[0].total;

    // Get proper total for filtered view
    let filteredTotal = counts[0].total;
    if (status && status !== 'All') {
      const [ft] = await db.query(
        'SELECT COUNT(*) as total FROM INCIDENT WHERE status = ?',
        [status]
      );
      filteredTotal = ft[0].total;
    }

    return {
      incidents: rows,
      total: filteredTotal,
      page: parseInt(page),
      pages: Math.ceil(filteredTotal / limit),
      counts: {
        total: counts[0].total,
        pending: counts[0].pending || 0,
        verified: counts[0].verified || 0,
        rejected: counts[0].rejected || 0
      }
    };
  },

  /**
   * Get analytics data for charts
   */
  async getAnalytics() {
    const [byType] = await db.query(
      `SELECT incidentType as type, COUNT(*) as count FROM INCIDENT GROUP BY incidentType`
    );

    const [bySeverity] = await db.query(
      `SELECT severity, COUNT(*) as count FROM INCIDENT GROUP BY severity`
    );

    const [byMonth] = await db.query(
      `SELECT DATE_FORMAT(reportedDate, '%Y-%m') as month, COUNT(*) as count
       FROM INCIDENT
       WHERE reportedDate >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month ASC`
    );

    return { byType, bySeverity, byMonth };
  }
};

module.exports = IncidentModel;
