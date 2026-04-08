const IncidentModel = require('../models/incident.model');

const IncidentController = {
  /**
   * GET /api/incidents — Browse all incidents with filters
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 20, keyword, timeRange, type, severity } = req.query;
      const data = await IncidentModel.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        keyword,
        timeRange,
        type,
        severity
      });
      return res.json(data);
    } catch (err) {
      console.error('Get incidents error:', err);
      return res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  },

  /**
   * POST /api/incidents — Submit a new incident
   */
  async create(req, res) {
    try {
      const { incidentType, severity, reportedDate, location, description } = req.body;
      const userID = req.user.userID;

      // Validate required fields
      if (!incidentType || !severity || !reportedDate || !description) {
        return res.status(400).json({ error: 'Incident type, severity, date, and description are required' });
      }

      // Validate enums
      const validTypes = ['Phishing', 'Malware', 'Data Breach', 'Online Fraud'];
      if (!validTypes.includes(incidentType)) {
        return res.status(400).json({ error: 'Invalid incident type' });
      }

      const validSeverities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validSeverities.includes(severity)) {
        return res.status(400).json({ error: 'Invalid severity level' });
      }

      // Validate description length
      if (description.length < 20) {
        return res.status(400).json({ error: 'Description must be at least 20 characters' });
      }

      // Validate date
      const date = new Date(reportedDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const incidentID = await IncidentModel.create({
        userID,
        incidentType,
        description,
        severity,
        reportedDate,
        location
      });

      return res.status(201).json({
        incidentID,
        status: 'Pending',
        message: 'Incident reported successfully'
      });
    } catch (err) {
      console.error('Create incident error:', err);
      return res.status(500).json({ error: 'Failed to report incident' });
    }
  },

  /**
   * GET /api/incidents/my — Get current user's incidents
   */
  async getMy(req, res) {
    try {
      const incidents = await IncidentModel.findByUserId(req.user.userID);
      return res.json({ incidents });
    } catch (err) {
      console.error('Get my incidents error:', err);
      return res.status(500).json({ error: 'Failed to fetch your incidents' });
    }
  },

  /**
   * GET /api/incidents/:id — Get single incident detail
   */
  async getById(req, res) {
    try {
      const incident = await IncidentModel.findById(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }
      return res.json(incident);
    } catch (err) {
      console.error('Get incident detail error:', err);
      return res.status(500).json({ error: 'Failed to fetch incident details' });
    }
  }
};

module.exports = IncidentController;
