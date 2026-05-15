# 🏥 MediCare – Healthcare Appointment Booking System

A full-stack healthcare appointment booking platform with authentication, admin dashboard, doctor management, and real-time appointment booking.

## 🚀 Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting, Mongo Sanitize
- **Email**: Nodemailer
- **File Uploads**: Multer

## 📁 Project Structure

```
health care/
├── healthcare-booking.html    # Main frontend (landing page)
├── login.html                 # Login page (Patient/Doctor/Admin)
├── register.html              # Registration page
├── patient-dashboard.html     # Patient dashboard
├── doctor-dashboard.html      # Doctor dashboard
├── admin-dashboard.html       # Admin dashboard
└── server/
    ├── server.js              # Express server entry
    ├── package.json
    ├── .env                   # Environment variables
    ├── config/
    │   ├── db.js              # MongoDB connection
    │   └── seed.js            # Sample data seeder
    ├── models/
    │   ├── User.js            # Patient/Admin model
    │   ├── Doctor.js          # Doctor model
    │   ├── Appointment.js     # Appointment model
    │   ├── Review.js          # Review/Rating model
    │   └── Notification.js    # Notification model
    ├── controllers/
    │   ├── authController.js
    │   ├── doctorController.js
    │   ├── appointmentController.js
    │   ├── userController.js
    │   ├── adminController.js
    │   └── reviewController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── doctorRoutes.js
    │   ├── appointmentRoutes.js
    │   ├── userRoutes.js
    │   ├── adminRoutes.js
    │   └── reviewRoutes.js
    ├── middleware/
    │   ├── auth.js            # JWT authentication
    │   ├── errorHandler.js    # Global error handling
    │   └── upload.js          # Multer file uploads
    ├── services/
    │   └── emailService.js    # Nodemailer email service
    └── uploads/               # Uploaded files directory
```

## ⚡ Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or MongoDB Atlas)

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
Edit `server/.env`:
```
MONGO_URI=mongodb://localhost:27017/medicare
JWT_SECRET=your_secret_key
```

### 3. Seed Sample Data
```bash
cd server
npm run seed
```

### 4. Start the Server
```bash
cd server
npm run dev
```

Server runs at: **http://localhost:5000**

### 5. Open the Website
Open `healthcare-booking.html` in your browser, or visit **http://localhost:5000**

## 🔐 Default Login Credentials

| Role    | Email                        | Password     |
|---------|------------------------------|--------------|
| Admin   | admin@medicare.in            | Admin@12345  |
| Patient | meera@test.com               | Test@123     |
| Doctor  | priya.sharma@medicare.in     | Doctor@123   |

## 📋 API Endpoints

### Auth
| Method | Endpoint                    | Description          |
|--------|----------------------------|----------------------|
| POST   | /api/auth/register          | Register patient     |
| POST   | /api/auth/login             | Login (patient/admin)|
| POST   | /api/auth/doctor-login      | Doctor login         |
| POST   | /api/auth/doctor-register   | Doctor registration  |
| POST   | /api/auth/forgot-password   | Forgot password      |
| POST   | /api/auth/reset-password    | Reset password       |

### Doctors
| Method | Endpoint                    | Description              |
|--------|----------------------------|--------------------------|
| GET    | /api/doctors                | Get all doctors (public) |
| GET    | /api/doctors/:id            | Get doctor details       |
| POST   | /api/doctors                | Create doctor (admin)    |
| PUT    | /api/doctors/:id            | Update doctor            |
| PUT    | /api/doctors/:id/approve    | Approve doctor (admin)   |

### Appointments
| Method | Endpoint                          | Description          |
|--------|----------------------------------|----------------------|
| POST   | /api/appointments                 | Create appointment   |
| GET    | /api/appointments                 | Get appointments     |
| PUT    | /api/appointments/:id/cancel      | Cancel appointment   |
| PUT    | /api/appointments/:id/reschedule  | Reschedule           |
| PUT    | /api/appointments/:id/complete    | Mark completed       |
| GET    | /api/appointments/export/csv      | Export CSV (admin)   |

### Users
| Method | Endpoint                    | Description          |
|--------|----------------------------|----------------------|
| GET    | /api/users/profile          | Get profile          |
| PUT    | /api/users/profile          | Update profile       |
| GET    | /api/users/dashboard        | Patient dashboard    |

### Admin
| Method | Endpoint                    | Description          |
|--------|----------------------------|----------------------|
| GET    | /api/admin/dashboard        | Admin analytics      |
| GET    | /api/admin/users            | All users            |
| GET    | /api/admin/doctors          | All doctors          |

## 🌐 Deployment

### MongoDB Atlas
1. Create a cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Update `MONGO_URI` in `.env` with your Atlas connection string

### Render (Backend)
1. Push to GitHub
2. Create a new Web Service on Render
3. Set build command: `cd server && npm install`
4. Set start command: `cd server && npm start`
5. Add environment variables from `.env`

### Vercel (Frontend)
1. Deploy the root directory to Vercel
2. Update `API_BASE` in frontend files to your Render URL

## 👨‍💻 Author
**VINAY G**

## 📄 License
ISC
