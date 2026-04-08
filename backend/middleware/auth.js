const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Authentication middleware
 * Verifies JWT from httpOnly cookie or Authorization header
 * Attaches user data to req.user on success
 */
function auth(req, res, next) {
  try {
    // Check for token in cookie first, then Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized — please log in' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userID: decoded.userID,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired — please log in again' });
    }
    return res.status(401).json({ error: 'Unauthorized — invalid token' });
  }
}

module.exports = auth;
