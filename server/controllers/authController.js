/**
 * ─── Auth Controller ─────────────────────────────────
 * Handles user registration, login, password reset
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const crypto = require('crypto');
const { generateToken } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

// Helper: check if MongoDB is connected
const checkDB = () => mongoose.connection.readyState === 1;

/**
 * @route   POST /api/auth/register
 * @desc    Register a new patient account
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    if (!checkDB()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please try again in a moment.'
      });
    }

    const { name, email, phone, password } = req.body;
    console.log('📝 Register attempt:', email);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'patient'
    });

    // Generate token
    const token = generateToken(user._id, user.role);
    console.log('✅ User registered:', email);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        token
      }
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed: ' + (error.code === 11000 ? 'Email already exists' : error.message)
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user (patient or admin)
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    if (!checkDB()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please try again in a moment.'
      });
    }

    const { email, password } = req.body;
    console.log('🔑 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check user with password field
    const user = await User.findOne({ email }).select('+password');
    console.log('   User found:', !!user);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.'
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    console.log('   Password match:', isMatch);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);
    console.log('✅ Login successful:', email, '| Role:', user.role);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please check your connection and try again.'
    });
  }
};

/**
 * @route   POST /api/auth/doctor-login
 * @desc    Login doctor
 * @access  Public
 */
exports.doctorLogin = async (req, res) => {
  try {
    if (!checkDB()) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please try again in a moment.'
      });
    }

    const { email, password } = req.body;
    console.log('🔑 Doctor login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!doctor.isApproved) {
      return res.status(401).json({
        success: false,
        message: 'Your account is pending approval by admin'
      });
    }

    const isMatch = await doctor.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(doctor._id, 'doctor');
    console.log('✅ Doctor login successful:', email);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        _id: doctor._id,
        doctorName: doctor.doctorName,
        email: doctor.email,
        specialty: doctor.specialty,
        role: 'doctor',
        profilePhoto: doctor.profilePhoto,
        token
      }
    });
  } catch (error) {
    console.error('❌ Doctor login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please check your connection and try again.'
    });
  }
};

/**
 * @route   POST /api/auth/doctor-register
 * @desc    Register a new doctor (requires admin approval)
 * @access  Public
 */
exports.doctorRegister = async (req, res) => {
  try {
    const { doctorName, email, password, specialty, experience, consultationFee, phone, hospital, bio } = req.body;

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'A doctor account with this email already exists'
      });
    }

    const doctor = await Doctor.create({
      doctorName,
      email,
      password,
      specialty,
      experience,
      consultationFee,
      phone,
      hospital,
      bio,
      isApproved: false  // Requires admin approval
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted! Your account will be activated after admin approval.',
      data: {
        _id: doctor._id,
        doctorName: doctor.doctorName,
        email: doctor.email,
        specialty: doctor.specialty
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send email
    await sendPasswordResetEmail(user.email, resetToken, user.name);

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful! You can now login.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
