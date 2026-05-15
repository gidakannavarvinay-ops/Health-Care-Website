/**
 * ─── Admin Routes ────────────────────────────────────
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboard, getUsers, toggleUser, getAllDoctors
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.put('/users/:id/toggle', toggleUser);
router.get('/doctors', getAllDoctors);

module.exports = router;
