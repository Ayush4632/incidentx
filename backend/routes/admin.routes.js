const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const AdminController = require('../controllers/admin.controller');

// Apply auth + adminOnly to all admin routes
router.use(auth, adminOnly);

// GET /api/admin/incidents — List all incidents with counts
router.get('/incidents', AdminController.getAll);

// PATCH /api/admin/incidents/:id/status — Verify or Reject
router.patch('/incidents/:id/status', AdminController.updateStatus);

// PUT /api/admin/incidents/:id — Edit incident
router.put('/incidents/:id', AdminController.updateIncident);

// DELETE /api/admin/incidents/:id — Delete incident
router.delete('/incidents/:id', AdminController.deleteIncident);

// GET /api/admin/analytics — Chart data
router.get('/analytics', AdminController.getAnalytics);

module.exports = router;
