/**
 * ─── Doctor Routes ───────────────────────────────────
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDoctors, getDoctorById, createDoctor, updateDoctor,
  deleteDoctor, updateAvailability, approveDoctor,
  getDoctorDashboard, getSpecialties
} = require('../controllers/doctorController');

// Public routes
router.get('/specialties/list', getSpecialties);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Protected routes
router.post('/', protect, authorize('admin'), createDoctor);
router.put('/:id', protect, updateDoctor);
router.delete('/:id', protect, authorize('admin'), deleteDoctor);
router.put('/:id/availability', protect, updateAvailability);
router.put('/:id/approve', protect, authorize('admin'), approveDoctor);
router.get('/:id/dashboard', protect, getDoctorDashboard);

module.exports = router;
