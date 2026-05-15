/**
 * ─── Email Service ───────────────────────────────────
 * Sends transactional emails using Nodemailer
 */
const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // If no email credentials configured, return null
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️  Email not configured - skipping email notifications');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send appointment confirmation email
 */
const sendAppointmentConfirmation = async (appointment) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MediCare <noreply@medicare.in>',
      to: appointment.patientEmail,
      subject: `✅ Appointment Confirmed - ${appointment.bookingId}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f6f2; padding: 40px 20px;">
          <div style="background: white; border-radius: 14px; padding: 40px; box-shadow: 0 2px 20px rgba(26,46,68,0.07);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a2e44; font-size: 24px; margin: 0;">
                ✦ Medi<span style="color: #2a9d8f;">Care</span>
              </h1>
            </div>
            <h2 style="color: #2a9d8f; text-align: center;">Appointment Confirmed! 🎉</h2>
            <div style="background: #e8f5f3; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${appointment.bookingId}</p>
              <p style="margin: 8px 0;"><strong>Patient:</strong> ${appointment.patientName}</p>
              <p style="margin: 8px 0;"><strong>Doctor:</strong> ${appointment.doctorName}</p>
              <p style="margin: 8px 0;"><strong>Specialty:</strong> ${appointment.specialty}</p>
              <p style="margin: 8px 0;"><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p style="margin: 8px 0;"><strong>Time:</strong> ${appointment.appointmentTime}</p>
            </div>
            <p style="color: #8a9ab0; font-size: 14px; text-align: center;">
              Please arrive 15 minutes before your scheduled time.<br/>
              If you need to cancel, please do so at least 2 hours before.
            </p>
          </div>
          <p style="text-align: center; color: #8a9ab0; font-size: 12px; margin-top: 20px;">
            © ${new Date().getFullYear()} MediCare. All rights reserved.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Confirmation email sent to ${appointment.patientEmail}`);
  } catch (error) {
    console.error('❌ Email send error:', error.message);
  }
};

/**
 * Send appointment cancellation email
 */
const sendCancellationEmail = async (appointment) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MediCare <noreply@medicare.in>',
      to: appointment.patientEmail,
      subject: `❌ Appointment Cancelled - ${appointment.bookingId}`,
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f6f2; padding: 40px 20px;">
          <div style="background: white; border-radius: 14px; padding: 40px;">
            <h1 style="color: #1a2e44; text-align: center;">✦ Medi<span style="color: #2a9d8f;">Care</span></h1>
            <h2 style="color: #e63946; text-align: center;">Appointment Cancelled</h2>
            <div style="background: #ffe5d9; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <p><strong>Booking ID:</strong> ${appointment.bookingId}</p>
              <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
              <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleDateString('en-IN')}</p>
              <p><strong>Time:</strong> ${appointment.appointmentTime}</p>
            </div>
            <p style="text-align: center; color: #8a9ab0;">
              You can book a new appointment anytime on our platform.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Cancellation email sent to ${appointment.patientEmail}`);
  } catch (error) {
    console.error('❌ Email send error:', error.message);
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetToken, name) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const resetUrl = `${process.env.CLIENT_URL}/reset-password.html?token=${resetToken}`;

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'MediCare <noreply@medicare.in>',
      to: email,
      subject: '🔐 Password Reset - MediCare',
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f6f2; padding: 40px 20px;">
          <div style="background: white; border-radius: 14px; padding: 40px;">
            <h1 style="color: #1a2e44; text-align: center;">✦ Medi<span style="color: #2a9d8f;">Care</span></h1>
            <h2 style="color: #1a2e44; text-align: center;">Password Reset</h2>
            <p>Hi ${name},</p>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #2a9d8f; color: white; padding: 14px 36px; border-radius: 50px; text-decoration: none; font-weight: 600;">
                Reset Password
              </a>
            </div>
            <p style="color: #8a9ab0; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}`);
  } catch (error) {
    console.error('❌ Email send error:', error.message);
  }
};

module.exports = {
  sendAppointmentConfirmation,
  sendCancellationEmail,
  sendPasswordResetEmail
};
