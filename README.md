# Zeal IT Accounts

A comprehensive payment and fine management system for **Zeal College of Engineering and Research, IT Department**. Built with the MERN stack (MongoDB, Express.js, React, Node.js).

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Features

### Core Features
- **Student Management** - Upload student data via CSV files
- **Payment Recording** - Record fines and fees with categories
- **Receipt Generation** - Professional PDF receipts with download option
- **Email Notifications** - Automatic receipt emails to students via Gmail SMTP
- **Expenditure Tracking** - Track department expenses by category
- **Dashboard Analytics** - Visual summary of income, expenditure, and balance

### Payment Features
- Payment types: **Fine** or **Fee**
- Custom payment categories (e.g., "Late Fine", "ITSA Committee Fees")
- Auto-generated receipt numbers (e.g., `RCP-20260122-54321`)
- All payments marked as paid automatically
- Date & time tracking for each payment

### Administrative Features
- Secure JWT-based authentication
- Category management (CRUD operations)
- Student search by PRN
- Payment history per student

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database (Atlas supported) |
| Mongoose | ODM for MongoDB |
| JWT | Authentication |
| Nodemailer | Email notifications |
| Multer | CSV file uploads |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| React Router | Navigation |
| Axios | HTTP client |
| React Icons | Icon library |
| html2pdf.js | PDF generation |

---

## 📁 Project Structure

```
internship/
├── Internship-backend/          # Backend API
│   ├── config/                  # Database configuration
│   ├── controllers/             # Route handlers
│   ├── middleware/              # Auth & error middleware
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # API routes
│   ├── utils/                   # Email service
│   ├── sample-data/             # Sample CSV file
│   ├── server.js                # Entry point
│   └── seeder.js                # Admin seeder
│
└── frontend/                    # React frontend
    ├── src/
    │   ├── components/          # Reusable components
    │   ├── context/             # Auth context
    │   ├── pages/               # Page components
    │   ├── services/            # API service
    │   └── index.css            # Tailwind styles
    └── index.html
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/zeal-it-accounts.git
cd zeal-it-accounts
```

#### 2. Backend Setup
```bash
cd Internship-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
# - MONGO_URI: Your MongoDB connection string
# - JWT_SECRET: A secure random string
# - EMAIL_USER: Your Gmail address
# - EMAIL_PASS: Gmail App Password

# Seed admin user
npm run seed

# Start development server
npm run dev
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 4. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🔐 Default Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@college.edu` |
| Password | `Admin@123` |

> ⚠️ **Change these credentials in production!**

---

## 📧 Email Configuration

To enable email notifications:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password at: https://myaccount.google.com/apppasswords
3. Update `.env` file:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current admin |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students/upload-csv` | Upload student CSV |
| GET | `/api/students/search/:prn` | Search by PRN |
| GET | `/api/students/:prn` | Get student details |
| POST | `/api/students/add-fine/:prn` | Add payment |
| GET | `/api/students/:prn/fines` | Get payment history |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Expenditure
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenditure/summary` | Get financial summary |
| POST | `/api/expenditure/add` | Add expenditure |
| GET | `/api/expenditure` | Get all expenditures |

---

## 📊 CSV Format

Upload students using a CSV file with the following format:

```csv
prn,name,department,email,phone
122E10001,John Doe,Computer Science,john@example.com,9876543210
122E10002,Jane Smith,Information Technology,jane@example.com,9876543211
```

A sample file is provided at `Internship-backend/sample-data/students-sample.csv`

---

## 🎨 Screenshots

### Dashboard
- Overview of income, expenditure, and balance
- Quick stats for total payments and students
- Expenditure breakdown by category

### Payment Receipt
- Professional PDF receipt generation
- Email notification with receipt attachment
- Receipt number for tracking

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret for JWT tokens | ✅ |
| `JWT_EXPIRES_IN` | Token expiration (e.g., `7d`) | ✅ |
| `PORT` | Server port (default: 5000) | ❌ |
| `NODE_ENV` | Environment mode | ❌ |
| `EMAIL_USER` | Gmail address for notifications | ❌ |
| `EMAIL_PASS` | Gmail App Password | ❌ |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Zeal College of Engineering and Research**  
IT Department Accounts Management System

---

## 🙏 Acknowledgments

- React Icons for the icon library
- Tailwind CSS for styling
- html2pdf.js for PDF generation
- Nodemailer for email functionality
