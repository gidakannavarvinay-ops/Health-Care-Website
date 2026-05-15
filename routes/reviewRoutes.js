/**
 * ─── Review Routes ───────────────────────────────────
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createReview, getDoctorReviews, deleteReview } = require('../controllers/reviewController');

router.post('/', protect, createReview);
router.get('/doctor/:doctorId', getDoctorReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;
