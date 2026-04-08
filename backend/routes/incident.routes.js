const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const IncidentController = require('../controllers/incident.controller');

// GET /api/incidents — Browse all incidents (public with filters)
router.get('/', IncidentController.getAll);

// GET /api/incidents/my — User's own incidents (auth required)
router.get('/my', auth, IncidentController.getMy);

// GET /api/incidents/:id — Single incident detail (auth required)
router.get('/:id', auth, IncidentController.getById);

// POST /api/incidents — Submit new incident (auth required)
router.post('/', auth, IncidentController.create);

module.exports = router;
