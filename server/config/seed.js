/**
 * ─── Database Seed Script ────────────────────────────
 * Populates the database with sample data
 * Run: npm run seed
 */
const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Fix DNS for MongoDB Atlas (same fix as db.js)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    await Review.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ── Create Admin ──
    const admin = await User.create({
      name: 'Admin MediCare',
      email: process.env.ADMIN_EMAIL || 'admin@medicare.in',
      phone: '9999999999',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin'
    });
    console.log('👤 Admin created:', admin.email);

    // ── Create Sample Patients ──
    const patients = await User.create([
      { name: 'Meera Iyer', email: 'meera@test.com', phone: '9876543210', password: 'Test@123', role: 'patient' },
      { name: 'Rohan Desai', email: 'rohan@test.com', phone: '9876543211', password: 'Test@123', role: 'patient' },
      { name: 'Sunita Rao', email: 'sunita@test.com', phone: '9876543212', password: 'Test@123', role: 'patient' },
      { name: 'Aarav Kumar', email: 'aarav@test.com', phone: '9876543213', password: 'Test@123', role: 'patient' },
      { name: 'Priya Singh', email: 'priya.s@test.com', phone: '9876543214', password: 'Test@123', role: 'patient' }
    ]);
    console.log(`👥 ${patients.length} patients created`);

    // ── Create Doctors ──
    const defaultSlots = [
      { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: true }
    ];

    const doctors = await Doctor.create([
      {
        doctorName: 'Dr. Priya Sharma',
        email: 'priya.sharma@medicare.in',
        phone: '9800000001',
        password: 'Doctor@123',
        specialty: 'Cardiology',
        experience: 12,
        consultationFee: 800,
        rating: 4.9,
        totalReviews: 312,
        totalPatients: 1200,
        bio: 'Expert cardiologist with 12+ years of experience in interventional cardiology and heart failure management.',
        hospital: 'MediCare Heart Institute',
        emoji: '🫀',
        availabilitySlots: defaultSlots,
        isApproved: true
      },
      {
        doctorName: 'Dr. Rahul Mehta',
        email: 'rahul.mehta@medicare.in',
        phone: '9800000002',
        password: 'Doctor@123',
        specialty: 'Neurology',
        experience: 9,
        consultationFee: 950,
        rating: 4.8,
        totalReviews: 204,
        totalPatients: 890,
        bio: 'Specialist in neurodegenerative diseases, stroke management, and epilepsy treatment.',
        hospital: 'MediCare Neuro Center',
        emoji: '🧠',
        availabilitySlots: defaultSlots,
        isApproved: true
      },
      {
        doctorName: 'Dr. Ananya Nair',
        email: 'ananya.nair@medicare.in',
        phone: '9800000003',
        password: 'Doctor@123',
        specialty: 'Dermatology',
        experience: 7,
        consultationFee: 700,
        rating: 4.9,
        totalReviews: 178,
        totalPatients: 740,
        bio: 'Expert in cosmetic dermatology, skin allergies, and hair restoration treatments.',
        hospital: 'MediCare Skin Clinic',
        emoji: '🩺',
        availabilitySlots: defaultSlots,
        isApproved: true
      },
      {
        doctorName: 'Dr. Arvind Patel',
        email: 'arvind.patel@medicare.in',
        phone: '9800000004',
        password: 'Doctor@123',
        specialty: 'Orthopedics',
        experience: 15,
        consultationFee: 1100,
        rating: 4.7,
        totalReviews: 419,
        totalPatients: 2000,
        bio: 'Senior orthopedic surgeon specializing in joint replacement and sports medicine.',
        hospital: 'MediCare Bone & Joint Center',
        emoji: '🦴',
        availabilitySlots: defaultSlots,
        isApproved: true
      },
      {
        doctorName: 'Dr. Kavita Reddy',
        email: 'kavita.reddy@medicare.in',
        phone: '9800000005',
        password: 'Doctor@123',
        specialty: 'Pediatrics',
        experience: 10,
        consultationFee: 600,
        rating: 4.8,
        totalReviews: 250,
        totalPatients: 1500,
        bio: 'Compassionate pediatrician with expertise in newborn care and childhood immunizations.',
        hospital: 'MediCare Children\'s Hospital',
        emoji: '👶',
        availabilitySlots: defaultSlots,
        isApproved: true
      },
      {
        doctorName: 'Dr. Sanjay Gupta',
        email: 'sanjay.gupta@medicare.in',
        phone: '9800000006',
        password: 'Doctor@123',
        specialty: 'Ophthalmology',
        experience: 11,
        consultationFee: 750,
        rating: 4.6,
        totalReviews: 190,
        totalPatients: 980,
        bio: 'Eye specialist with expertise in LASIK surgery and cataract treatment.',
        hospital: 'MediCare Eye Center',
        emoji: '👁️',
        availabilitySlots: defaultSlots,
        isApproved: true
      },
      {
        doctorName: 'Dr. Neha Kapoor',
        email: 'neha.kapoor@medicare.in',
        phone: '9800000007',
        password: 'Doctor@123',
        specialty: 'Psychiatry',
        experience: 8,
        consultationFee: 900,
        rating: 4.9,
        totalReviews: 156,
        totalPatients: 650,
        bio: 'Mental health specialist focusing on anxiety, depression, and cognitive behavioral therapy.',
        hospital: 'MediCare Mind Wellness',
        emoji: '🧘',
        availabilitySlots: defaultSlots,
        isApproved: true
      },
      {
        doctorName: 'Dr. Vikram Singh',
        email: 'vikram.singh@medicare.in',
        phone: '9800000008',
        password: 'Doctor@123',
        specialty: 'General Medicine',
        experience: 14,
        consultationFee: 500,
        rating: 4.7,
        totalReviews: 380,
        totalPatients: 3000,
        bio: 'Experienced general physician providing comprehensive primary healthcare services.',
        hospital: 'MediCare General Hospital',
        emoji: '💊',
        availabilitySlots: defaultSlots,
        isApproved: true
      }
    ]);
    console.log(`🩺 ${doctors.length} doctors created`);

    // ── Create Sample Appointments ──
    const now = new Date();
    const appointments = await Appointment.create([
      {
        patientId: patients[0]._id, patientName: 'Meera Iyer', patientEmail: 'meera@test.com', patientPhone: '9876543210',
        doctorId: doctors[0]._id, doctorName: 'Dr. Priya Sharma', specialty: 'Cardiology',
        appointmentDate: new Date(now.getTime() + 86400000), appointmentTime: '10:00 AM',
        symptoms: 'Regular checkup, mild chest pain', status: 'confirmed', paymentAmount: 800, paymentStatus: 'paid'
      },
      {
        patientId: patients[1]._id, patientName: 'Rohan Desai', patientEmail: 'rohan@test.com', patientPhone: '9876543211',
        doctorId: doctors[1]._id, doctorName: 'Dr. Rahul Mehta', specialty: 'Neurology',
        appointmentDate: new Date(now.getTime() + 172800000), appointmentTime: '11:00 AM',
        symptoms: 'Frequent headaches, dizziness', status: 'pending', paymentAmount: 950
      },
      {
        patientId: patients[2]._id, patientName: 'Sunita Rao', patientEmail: 'sunita@test.com', patientPhone: '9876543212',
        doctorId: doctors[4]._id, doctorName: 'Dr. Kavita Reddy', specialty: 'Pediatrics',
        appointmentDate: new Date(now.getTime() - 86400000), appointmentTime: '09:00 AM',
        symptoms: 'Child fever and cold', status: 'completed', paymentAmount: 600, paymentStatus: 'paid'
      },
      {
        patientId: patients[3]._id, patientName: 'Aarav Kumar', patientEmail: 'aarav@test.com', patientPhone: '9876543213',
        doctorId: doctors[2]._id, doctorName: 'Dr. Ananya Nair', specialty: 'Dermatology',
        appointmentDate: new Date(now.getTime() + 259200000), appointmentTime: '02:00 PM',
        symptoms: 'Skin rash and itching', status: 'pending', paymentAmount: 700
      },
      {
        patientId: patients[4]._id, patientName: 'Priya Singh', patientEmail: 'priya.s@test.com', patientPhone: '9876543214',
        doctorId: doctors[3]._id, doctorName: 'Dr. Arvind Patel', specialty: 'Orthopedics',
        appointmentDate: new Date(now.getTime() - 172800000), appointmentTime: '03:00 PM',
        symptoms: 'Knee pain, difficulty walking', status: 'completed', paymentAmount: 1100, paymentStatus: 'paid'
      }
    ]);
    console.log(`📅 ${appointments.length} appointments created`);

    // ── Create Sample Reviews ──
    await Review.create([
      { patient: patients[0]._id, doctor: doctors[0]._id, rating: 5, comment: 'Booking was incredibly smooth. The doctor was absolutely brilliant.' },
      { patient: patients[1]._id, doctor: doctors[1]._id, rating: 5, comment: 'Dr. Mehta was incredibly thorough and explained everything clearly.' },
      { patient: patients[2]._id, doctor: doctors[4]._id, rating: 5, comment: 'The pediatrician was so patient and caring. MediCare is now my go-to.' }
    ]);
    console.log('⭐ Sample reviews created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('─────────────────────────────────────');
    console.log('Admin Login:  admin@medicare.in / Admin@12345');
    console.log('Patient Login: meera@test.com / Test@123');
    console.log('Doctor Login:  priya.sharma@medicare.in / Doctor@123');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
