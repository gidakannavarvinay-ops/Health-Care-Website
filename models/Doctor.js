/**
 * ─── Doctor Model ────────────────────────────────────
 * Stores doctor profiles with availability slots
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const availabilitySlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: { type: String, required: true },  // "09:00"
  endTime: { type: String, required: true },     // "17:00"
  isAvailable: { type: Boolean, default: true }
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative']
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Fee cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalPatients: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  hospital: {
    type: String,
    trim: true,
    default: ''
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  certificates: [{
    type: String
  }],
  availabilitySlots: [availabilitySlotSchema],
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emoji: {
    type: String,
    default: '🩺'
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
doctorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Doctor', doctorSchema);
