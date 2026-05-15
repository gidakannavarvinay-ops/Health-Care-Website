/**
 * ─── Appointment Routes ──────────────────────────────
 */
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createAppointment, getAppointments, getAppointmentById,
  updateAppointment, cancelAppointment, rescheduleAppointment,
  completeAppointment, deleteAppointment, exportCSV
} = require('../controllers/appointmentController');

// Public route (guest booking)
router.post('/', createAppointment);

// Protected routes
router.get('/', protect, getAppointments);
router.get('/export/csv', protect, authorize('admin'), exportCSV);
router.get('/:id', protect, getAppointmentById);
router.put('/:id', protect, updateAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/reschedule', protect, rescheduleAppointment);
router.put('/:id/complete', protect, completeAppointment);
router.delete('/:id', protect, authorize('admin'), deleteAppointment);

module.exports = router;
