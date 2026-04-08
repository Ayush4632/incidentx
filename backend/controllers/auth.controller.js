const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
require('dotenv').config();

const SALT_ROUNDS = 10;
const JWT_EXPIRY = '24h';

const AuthController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate username length
      if (username.length < 3 || username.length > 50) {
        return res.status(400).json({ error: 'Username must be 3-50 characters' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password strength
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          error: 'Password must be at least 8 characters with at least 1 letter and 1 number'
        });
      }

      // Check if username already exists
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      // Check if email already exists
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      await UserModel.create({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });

      return res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Registration failed: ' + err.message });
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      // Find user
      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Check account status
      if (user.accountStatus === 'inactive') {
        return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
      }

      // Compare password
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userID: user.userID, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      // Set httpOnly cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      return res.status(200).json({
        message: 'Login successful',
        userID: user.userID,
        username: user.username,
        role: user.role
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed: ' + err.message });
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res) {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
  }
};

module.exports = AuthController;
