# 🏫 ITSA Accounts - Student Finance Management System

A comprehensive **MERN stack** web application for managing student fees, fines, expenditures, fee ledgers, and complete financial reporting for educational institutions.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributors](#-contributors)

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication
- First-time setup wizard
- OTP-based password reset via email
- Rate limiting protection against brute-force attacks
- Secure password hashing with bcrypt

### 👨‍🎓 Student Management
- Add individual students or bulk upload via CSV
- Search students by PRN, Name, or Roll Number
- View complete student profile with payment history
- Delete students individually or by class/division

### 💰 Fee & Fine Management
- **Fee Ledger System**: Create fee demands for entire classes
- Track "Paid", "Partial", and "Pending" status
- Auto-sync: Manual payments update corresponding ledgers
- Multiple payment categories (Tuition, Library, Lab, etc.)
- Support for both Fees and Fines

### 📊 Financial Reports
- **Transaction Report**: Daily income and expenditure tracking
- Search transactions by Receipt Number, PRN, or Name
- Download PDF receipts for any transaction
- Class-wise and Category-wise summaries
- Net Balance calculation (Income - Expenditure)

### 💸 Expenditure Tracking
- Log college expenses with categories
- Attach receipt numbers and descriptions
- View expenditure reports by date range

### 📧 Email Notifications
- Automatic email receipts on payment
- OTP emails for password reset
- Professional HTML email templates

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| TailwindCSS | Styling |
| React Router v6 | Navigation |
| Axios | API Calls |
| React Icons | Icons |
| html2pdf.js | Receipt Generation |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | Web Framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| Nodemailer | Email Service |
| express-rate-limit | Security |

---

## 📁 Project Structure

```
internship/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth)
│   │   ├── pages/            # Page components
│   │   ├── services/         # API service layer
│   │   └── App.jsx           # Main App component
│   ├── public/
│   └── package.json
│
├── Internship-backend/       # Node.js Backend
│   ├── config/               # Database configuration
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth & Error handling
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── utils/                # Helper functions
│   ├── server.js             # Entry point
│   └── package.json
│
└── README.md
```

---

## � Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Gmail account for email notifications

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/college-fine-management.git
cd college-fine-management
```

### 2. Backend Setup
```bash
cd Internship-backend
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 🔧 Environment Variables

### Backend (`Internship-backend/.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend (`frontend/.env`)
```env
# API URL (for production deployment)
VITE_API_URL=https://your-backend-url.onrender.com/api
```

> **Note**: For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password).

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/setup-status` | Check if first-time setup required |
| POST | `/api/auth/register` | Register first admin |
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/profile` | Get admin profile |
| POST | `/api/auth/forgot-password` | Request password reset OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/reset-password` | Reset password |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students (paginated) |
| GET | `/api/students/search` | Search students |
| GET | `/api/students/:prn` | Get student by PRN |
| POST | `/api/students/add` | Add new student |
| POST | `/api/students/upload-csv` | Bulk upload via CSV |
| POST | `/api/students/add-fine/:prn` | Add payment/fine |
| DELETE | `/api/students/:prn` | Delete student |

### Fee Ledger
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fee-ledger` | Get all ledger entries |
| POST | `/api/fee-ledger/generate` | Generate fee ledger for class |
| POST | `/api/fee-ledger/:id/pay` | Record payment |
| DELETE | `/api/fee-ledger/bulk-delete` | Bulk delete ledgers |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/transactions` | Get all transactions |
| GET | `/api/reports/student-payments` | Get student payment summary |

---

## 🌍 Deployment

### Backend (Render)
1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Set **Root Directory** to `Internship-backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add all environment variables
7. Deploy!

### Frontend (Vercel)
1. Create a new **Project** on [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
5. Deploy!

---

## 📸 Screenshots

*Coming soon...*

---

## 👥 Contributors

- **Pratik Tawhare** - [GitHub](https://github.com/pratiktawhare) | [Email](mailto:pratiktawhare3@gmail.com)
- **Abhijeet Suryawanshi** - [GitHub](https://github.com/abhijeetsuryawanshi) | [Email](mailto:abhijeetsuryawanshi23@gmail.com)

---

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for ITSA (Information Technology Students Association)
- Developed as an internship project

---

Made with ❤️ for educational institutions
