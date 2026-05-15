/**
 * ─── JWT Authentication Middleware ───────────────────
 * Verifies JWT tokens and protects routes
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

/**
 * Protect routes - requires valid JWT
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - no token provided'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user or doctor
    if (decoded.role === 'doctor') {
      req.user = await Doctor.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Doctor not found'
        });
      }
      req.user.role = 'doctor';
    } else {
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - token expired or invalid'
    });
  }
};

/**
 * Role-based authorization
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Generate JWT Token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = { protect, authorize, generateToken };
