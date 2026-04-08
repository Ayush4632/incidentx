const IncidentModel = require('../models/incident.model');
const VerificationModel = require('../models/verification.model');

const AdminController = {
  /**
   * GET /api/admin/incidents — List all incidents with counts
   */
  async getAll(req, res) {
    try {
      const { status = 'All', page = 1, limit = 20 } = req.query;
      const data = await IncidentModel.findAllAdmin({
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      return res.json(data);
    } catch (err) {
      console.error('Admin get incidents error:', err);
      return res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  },

  /**
   * PATCH /api/admin/incidents/:id/status — Verify or Reject
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;

      if (!status || !['Verified', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be Verified or Rejected' });
      }

      // Check incident exists
      const incident = await IncidentModel.findById(id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Update status
      await IncidentModel.updateStatus(id, status);

      // Log to audit trail
      await VerificationModel.logAction({
        incidentID: id,
        adminID: req.user.userID,
        action: status === 'Verified' ? 'VERIFY' : 'REJECT',
        comments: comments || null
      });

      return res.json({ message: `Incident ${status.toLowerCase()} successfully` });
    } catch (err) {
      console.error('Update status error:', err);
      return res.status(500).json({ error: 'Failed to update incident status' });
    }
  },

  /**
   * PUT /api/admin/incidents/:id — Edit incident details
   */
  async updateIncident(req, res) {
    try {
      const { id } = req.params;
      const { incidentType, severity, description, location, reportedDate } = req.body;

      // Check incident exists
      const incident = await IncidentModel.findById(id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Validate description if provided
      if (description && description.length < 20) {
        return res.status(400).json({ error: 'Description must be at least 20 characters' });
      }

      // Update incident
      await IncidentModel.update(id, {
        incidentType,
        severity,
        description,
        location,
        reportedDate
      });

      // Log to audit trail
      await VerificationModel.logAction({
        incidentID: id,
        adminID: req.user.userID,
        action: 'EDIT',
        comments: 'Incident details updated by admin'
      });

      return res.json({ message: 'Incident updated successfully' });
    } catch (err) {
      console.error('Update incident error:', err);
      return res.status(500).json({ error: 'Failed to update incident' });
    }
  },

  /**
   * DELETE /api/admin/incidents/:id — Delete an incident
   */
  async deleteIncident(req, res) {
    try {
      const { id } = req.params;

      // Check incident exists
      const incident = await IncidentModel.findById(id);
      if (!incident) {
        return res.status(404).json({ error: 'Incident not found' });
      }

      // Log to audit trail BEFORE deleting (FK constraint)
      await VerificationModel.logAction({
        incidentID: id,
        adminID: req.user.userID,
        action: 'DELETE',
        comments: 'Incident deleted by admin'
      });

      // Delete incident (cascades will clean up verification records)
      await IncidentModel.delete(id);

      return res.json({ message: 'Incident deleted successfully' });
    } catch (err) {
      console.error('Delete incident error:', err);
      return res.status(500).json({ error: 'Failed to delete incident' });
    }
  },

  /**
   * GET /api/admin/analytics — Chart data
   */
  async getAnalytics(req, res) {
    try {
      const data = await IncidentModel.getAnalytics();
      return res.json(data);
    } catch (err) {
      console.error('Analytics error:', err);
      return res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
  }
};

module.exports = AdminController;
