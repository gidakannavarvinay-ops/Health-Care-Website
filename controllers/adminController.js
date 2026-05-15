/**
 * ─── Admin Controller ────────────────────────────────
 * Admin dashboard, analytics, and management
 */
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard analytics
 * @access  Private/Admin
 */
exports.getDashboard = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await Doctor.countDocuments({ isApproved: true });
    const pendingDoctors = await Doctor.countDocuments({ isApproved: false });
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'cancelled' });

    // Revenue
    const revenueResult = await Appointment.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paymentAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Monthly appointment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrends = await Appointment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$paymentAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Specialty distribution
    const specialtyStats = await Appointment.aggregate([
      { $group: { _id: '$specialty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent bookings
    const recentBookings = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(10);

    // Top doctors by appointments
    const topDoctors = await Appointment.aggregate([
      { $match: { status: { $in: ['completed', 'confirmed'] } } },
      { $group: { _id: '$doctorName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        monthlyTrends,
        specialtyStats,
        recentBookings,
        topDoctors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(query);

    res.json({
      success: true, count: users.length, total,
      totalPages: Math.ceil(total / parseInt(limit)),
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PUT /api/admin/users/:id/toggle
 * @desc    Activate/deactivate user
 * @access  Private/Admin
 */
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/admin/doctors
 * @desc    Get all doctors (including unapproved)
 * @access  Private/Admin
 */
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
