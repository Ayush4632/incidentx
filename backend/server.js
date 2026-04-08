const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --------------- Middleware ---------------
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------- Serve Frontend ---------------
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// --------------- API Routes ---------------
const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const adminRoutes = require('./routes/admin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/admin', adminRoutes);

// --------------- SPA Fallback ---------------
app.get('*', (req, res) => {
  // If it's not an API route, serve the frontend
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  }
});

// --------------- Error Handling ---------------
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// --------------- Start Server ---------------
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   🛡️  IncidentX Server Running            ║
  ║   📡 Port: ${PORT}                           ║
  ║   🌐 http://localhost:${PORT}                ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
