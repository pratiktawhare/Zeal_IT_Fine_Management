/**
 * ===========================================
 * Server Entry Point
 * ===========================================
 * Main server file that initializes Express app,
 * connects to MongoDB, and starts the server
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// ===========================================
// Middleware Setup
// ===========================================

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ===========================================
// API Routes
// ===========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'ITSA Accounts API is running',
        timestamp: new Date().toISOString()
    });
});

// Authentication routes
app.use('/api/auth', require('./routes/authRoutes'));

// Student routes
app.use('/api/students', require('./routes/studentRoutes'));

// Expenditure routes
app.use('/api/expenditure', require('./routes/expenditureRoutes'));

// Category routes
app.use('/api/categories', require('./routes/categoryRoutes'));

// Report routes (new)
app.use('/api/reports', require('./routes/reportRoutes'));

// Fee Ledger routes
app.use('/api/fee-ledger', require('./routes/feeLedgerRoutes'));

// Backup routes (Google Drive)
app.use('/api/backup', require('./routes/backupRoutes'));

// ===========================================
// Error Handling Middleware
// ===========================================

// Handle 404 - Route not found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ===========================================
// Server Initialization
// ===========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Server listening on port ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}/api`);
    console.log(`===========================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    // Close server & exit process
    process.exit(1);
});
