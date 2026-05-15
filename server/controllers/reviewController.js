/**
 * ─── Review Controller ───────────────────────────────
 * Patient reviews and ratings for doctors
 */
const Review = require('../models/Review');

/**
 * @route   POST /api/reviews
 * @desc    Create a review
 * @access  Private
 */
exports.createReview = async (req, res) => {
  try {
    const { doctor, rating, comment, appointment } = req.body;
    const review = await Review.create({
      patient: req.user._id,
      doctor,
      rating,
      comment,
      appointment
    });
    res.status(201).json({ success: true, message: 'Review submitted', data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this doctor' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/reviews/doctor/:doctorId
 * @desc    Get reviews for a doctor
 * @access  Public
 */
exports.getDoctorReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ doctor: req.params.doctorId, isApproved: true })
      .populate('patient', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review
 * @access  Private
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      patient: req.user._id
    });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = exports;
