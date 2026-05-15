/**
 * ─── Doctor Controller ───────────────────────────────
 * CRUD operations for doctor management
 */
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

/**
 * @route   GET /api/doctors
 * @desc    Get all approved doctors (with filtering)
 * @access  Public
 */
exports.getDoctors = async (req, res) => {
  try {
    const { specialty, search, hospital, minExp, maxFee, sort, page = 1, limit = 12 } = req.query;

    // Build query
    const query = { isApproved: true, isActive: true };

    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' };
    }

    if (hospital) {
      query.hospital = { $regex: hospital, $options: 'i' };
    }

    if (minExp) {
      query.experience = { $gte: parseInt(minExp) };
    }

    if (maxFee) {
      query.consultationFee = { $lte: parseInt(maxFee) };
    }

    if (search) {
      query.$or = [
        { doctorName: { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { hospital: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    let sortObj = { createdAt: -1 };
    if (sort === 'rating') sortObj = { rating: -1 };
    if (sort === 'experience') sortObj = { experience: -1 };
    if (sort === 'fee-low') sortObj = { consultationFee: 1 };
    if (sort === 'fee-high') sortObj = { consultationFee: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const doctors = await Doctor.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(query);

    res.json({
      success: true,
      count: doctors.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: doctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/doctors/:id
 * @desc    Get single doctor by ID
 * @access  Public
 */
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   POST /api/doctors
 * @desc    Create a doctor (admin only)
 * @access  Private/Admin
 */
exports.createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create({
      ...req.body,
      isApproved: true  // Admin-created doctors are auto-approved
    });

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   PUT /api/doctors/:id
 * @desc    Update doctor profile
 * @access  Private (Doctor/Admin)
 */
exports.updateDoctor = async (req, res) => {
  try {
    // Don't allow password update through this route
    const { password, ...updateData } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   DELETE /api/doctors/:id
 * @desc    Delete/deactivate doctor
 * @access  Private/Admin
 */
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Doctor deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   PUT /api/doctors/:id/availability
 * @desc    Update doctor availability slots
 * @access  Private/Doctor
 */
exports.updateAvailability = async (req, res) => {
  try {
    const { availabilitySlots } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { availabilitySlots },
      { new: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   PUT /api/doctors/:id/approve
 * @desc    Approve/reject doctor registration
 * @access  Private/Admin
 */
exports.approveDoctor = async (req, res) => {
  try {
    const { isApproved } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    ).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      message: `Doctor ${isApproved ? 'approved' : 'rejected'} successfully`,
      data: doctor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/doctors/:id/dashboard
 * @desc    Get doctor dashboard stats
 * @access  Private/Doctor
 */
exports.getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's appointments
    const todayAppointments = await Appointment.find({
      doctorId,
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ appointmentTime: 1 });

    // Total stats
    const totalAppointments = await Appointment.countDocuments({ doctorId });
    const completedAppointments = await Appointment.countDocuments({ doctorId, status: 'completed' });
    const pendingAppointments = await Appointment.countDocuments({ doctorId, status: 'pending' });

    // Earnings
    const earningsResult = await Appointment.aggregate([
      { $match: { doctorId: require('mongoose').Types.ObjectId.createFromHexString(doctorId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
    ]);
    const totalEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;

    // Recent appointments
    const recentAppointments = await Appointment.find({ doctorId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        todayAppointments,
        totalAppointments,
        completedAppointments,
        pendingAppointments,
        totalEarnings,
        recentAppointments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @route   GET /api/doctors/specialties/list
 * @desc    Get all unique specialties
 * @access  Public
 */
exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await Doctor.distinct('specialty', { isApproved: true, isActive: true });

    res.json({
      success: true,
      data: specialties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
