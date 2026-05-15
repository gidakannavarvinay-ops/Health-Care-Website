/**
 * ─── Appointment Controller ──────────────────────────
 * Manages appointment CRUD and status operations
 */
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { sendAppointmentConfirmation, sendCancellationEmail } = require('../services/emailService');

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment
 * @access  Public (guest) or Private (authenticated)
 */
exports.createAppointment = async (req, res) => {
  try {
    const {
      patientName, patientEmail, patientPhone,
      doctorName, specialty, appointmentDate,
      appointmentTime, symptoms, doctorId
    } = req.body;

    // Check for double booking if doctorId provided
    if (doctorId) {
      const isBooked = await Appointment.isSlotTaken(doctorId, appointmentDate, appointmentTime);
      if (isBooked) {
        return res.status(400).json({
          success: false,
          message: 'This time slot is already booked. Please choose another slot.'
        });
      }
    }

    // Build appointment data
    const appointmentData = {
      patientName,
      patientEmail,
      patientPhone,
      doctorName: doctorName || 'Any Available Doctor',
      specialty,
      appointmentDate,
      appointmentTime,
      symptoms: symptoms || '',
      patientId: req.user ? req.user._id : null,
      doctorId: doctorId || null
    };

    // Set payment amount from doctor fee
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        appointmentData.paymentAmount = doctor.consultationFee;
      }
    }

    const appointment = await Appointment.create(appointmentData);

    // Send confirmation email (async, don't wait)
    sendAppointmentConfirmation(appointment).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: appointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/appointments
 * @desc    Get appointments (filtered by role)
 */
exports.getAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate, search } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user) {
      if (req.user.role === 'patient') {
        query.patientId = req.user._id;
      } else if (req.user.role === 'doctor') {
        query.doctorId = req.user._id;
      }
      // Admin sees all
    }

    if (status) query.status = status;
    if (startDate && endDate) {
      query.appointmentDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } },
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      count: appointments.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: appointments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment
 */
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment status
 */
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment updated', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PUT /api/appointments/:id/cancel
 * @desc    Cancel appointment
 */
exports.cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancelReason: reason || 'Cancelled by user' },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    sendCancellationEmail(appointment).catch(console.error);
    res.json({ success: true, message: 'Appointment cancelled', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PUT /api/appointments/:id/reschedule
 * @desc    Reschedule appointment
 */
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentDate, appointmentTime } = req.body;
    const existing = await Appointment.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check new slot
    if (existing.doctorId) {
      const isBooked = await Appointment.isSlotTaken(existing.doctorId, appointmentDate, appointmentTime);
      if (isBooked) {
        return res.status(400).json({ success: false, message: 'New slot is already booked' });
      }
    }

    existing.rescheduledFrom = existing.appointmentDate;
    existing.appointmentDate = appointmentDate;
    existing.appointmentTime = appointmentTime;
    existing.status = 'rescheduled';
    await existing.save();

    res.json({ success: true, message: 'Appointment rescheduled', data: existing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PUT /api/appointments/:id/complete
 * @desc    Mark appointment as completed
 */
exports.completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed' },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    // Increment doctor's patient count
    if (appointment.doctorId) {
      await Doctor.findByIdAndUpdate(appointment.doctorId, { $inc: { totalPatients: 1 } });
    }
    res.json({ success: true, message: 'Appointment marked as completed', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Delete appointment (admin only)
 */
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/appointments/export/csv
 * @desc    Export appointments to CSV
 */
exports.exportCSV = async (req, res) => {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });
    const headers = 'Booking ID,Patient Name,Email,Phone,Doctor,Specialty,Date,Time,Status,Payment\n';
    const rows = appointments.map(a =>
      `${a.bookingId},${a.patientName},${a.patientEmail},${a.patientPhone},${a.doctorName},${a.specialty},${new Date(a.appointmentDate).toLocaleDateString()},${a.appointmentTime},${a.status},${a.paymentStatus}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=appointments.csv');
    res.send(headers + rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
