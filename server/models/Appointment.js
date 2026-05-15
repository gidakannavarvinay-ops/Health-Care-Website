/**
 * ─── Appointment Model ───────────────────────────────
 * Stores appointment bookings with status tracking
 */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const appointmentSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    default: () => 'MC-' + uuidv4().split('-')[0].toUpperCase()
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null  // null for guest bookings
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  patientEmail: {
    type: String,
    required: [true, 'Patient email is required'],
    lowercase: true,
    trim: true
  },
  patientPhone: {
    type: String,
    required: [true, 'Patient phone is required'],
    trim: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true
  },
  specialty: {
    type: String,
    required: [true, 'Specialty is required'],
    trim: true
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required']
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    trim: true
  },
  symptoms: {
    type: String,
    default: '',
    maxlength: [1000, 'Symptoms description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rescheduled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentId: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  cancelReason: {
    type: String,
    default: ''
  },
  rescheduledFrom: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for preventing double bookings
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, appointmentTime: 1, status: 1 },
  { unique: false }
);

// Static method to check for double booking
appointmentSchema.statics.isSlotTaken = async function(doctorId, date, time) {
  const existing = await this.findOne({
    doctorId,
    appointmentDate: date,
    appointmentTime: time,
    status: { $in: ['pending', 'confirmed'] }
  });
  return !!existing;
};

module.exports = mongoose.model('Appointment', appointmentSchema);
