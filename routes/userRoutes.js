/**
 * ─── User Routes ─────────────────────────────────────
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getProfile, updateProfile, uploadPhoto,
  getDashboard, toggleFavorite
} = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/photo', protect, upload.single('profileImage'), uploadPhoto);
router.get('/dashboard', protect, getDashboard);
router.post('/favorites/:doctorId', protect, toggleFavorite);

module.exports = router;
