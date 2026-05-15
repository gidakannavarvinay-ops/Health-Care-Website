/**
 * ─── User Controller ─────────────────────────────────
 * Profile management for patients
 */
const User = require('../models/User');
const Appointment = require('../models/Appointment');

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteDoctors');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, profileImage },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/users/profile/photo
 * @desc    Upload profile photo
 * @access  Private
 */
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user._id, { profileImage: photoUrl });
    res.json({ success: true, message: 'Photo uploaded', data: { url: photoUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/users/dashboard
 * @desc    Get patient dashboard data
 * @access  Private
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = await Appointment.find({
      patientId: userId,
      appointmentDate: { $gte: today },
      status: { $in: ['pending', 'confirmed'] }
    }).sort({ appointmentDate: 1 }).limit(5);

    const past = await Appointment.find({
      patientId: userId,
      $or: [
        { appointmentDate: { $lt: today } },
        { status: { $in: ['completed', 'cancelled'] } }
      ]
    }).sort({ appointmentDate: -1 }).limit(10);

    const totalBookings = await Appointment.countDocuments({ patientId: userId });

    res.json({
      success: true,
      data: { upcoming, past, totalBookings }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/users/favorites/:doctorId
 * @desc    Toggle favorite doctor
 * @access  Private
 */
exports.toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const doctorId = req.params.doctorId;
    const index = user.favoriteDoctors.indexOf(doctorId);

    if (index > -1) {
      user.favoriteDoctors.splice(index, 1);
    } else {
      user.favoriteDoctors.push(doctorId);
    }
    await user.save();

    res.json({
      success: true,
      message: index > -1 ? 'Removed from favorites' : 'Added to favorites',
      data: user.favoriteDoctors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
