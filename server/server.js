/**
 * ═══════════════════════════════════════════════════════
 *  MediCare Backend Server
 *  Healthcare Appointment Booking System
 * ═══════════════════════════════════════════════════════
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ─── Initialize Express ─────────────────────────────
const app = express();

// ─── Connect to MongoDB ─────────────────────────────
connectDB();

// ─── Security Middleware ─────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ─── CORS Configuration ─────────────────────────────
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5500", "*"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ─── Rate Limiting ──────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// ─── Body Parsing ───────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── MongoDB Injection Prevention ───────────────────
app.use(mongoSanitize());

// ─── Static Files ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// ─── API Routes ─────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// ─── Health Check ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MediCare API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ─── Serve Frontend Pages ───────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin-dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'register.html'));
});

app.get('/patient-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'patient-dashboard.html'));
});

app.get('/doctor-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'doctor-dashboard.html'));
});

// ─── Error Handling ─────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server with Auto-Port Recovery ───────────
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║     🏥 MediCare Server Running                       ║
║     📡 Port: ${port}                                   ║
║     🌍 Env: ${(process.env.NODE_ENV || 'development').padEnd(20)}            ║
║     📋 API: http://localhost:${port}/api/health         ║
╚═══════════════════════════════════════════════════════╝
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${port} is busy, trying port ${port + 1}...`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    }
  });
};

const PORT = parseInt(process.env.PORT, 10) || 5001;
startServer(PORT);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
