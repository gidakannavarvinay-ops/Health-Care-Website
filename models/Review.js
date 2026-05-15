/**
 * ─── Review Model ────────────────────────────────────
 * Patient reviews and ratings for doctors
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor reference is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  isApproved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews per patient per doctor
reviewSchema.index({ patient: 1, doctor: 1 }, { unique: true });

// Static method to calculate average rating for a doctor
reviewSchema.statics.calcAverageRating = async function(doctorId) {
  const result = await this.aggregate([
    { $match: { doctor: doctorId, isApproved: true } },
    {
      $group: {
        _id: '$doctor',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const Doctor = require('./Doctor');
  if (result.length > 0) {
    await Doctor.findByIdAndUpdate(doctorId, {
      rating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews
    });
  } else {
    await Doctor.findByIdAndUpdate(doctorId, {
      rating: 0,
      totalReviews: 0
    });
  }
};

// Recalculate after save/remove
reviewSchema.post('save', function() {
  this.constructor.calcAverageRating(this.doctor);
});

reviewSchema.post('findOneAndDelete', function(doc) {
  if (doc) doc.constructor.calcAverageRating(doc.doctor);
});

module.exports = mongoose.model('Review', reviewSchema);
