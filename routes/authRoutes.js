/**
 * ─── Auth Routes ─────────────────────────────────────
 */
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
  register, login, doctorLogin, doctorRegister,
  forgotPassword, resetPassword, changePassword
} = require('../controllers/authController');

// Validation middleware
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation error handler
const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/doctor-login', loginValidation, validate, doctorLogin);
router.post('/doctor-register', doctorRegister);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/change-password', protect, changePassword);

module.exports = router;
