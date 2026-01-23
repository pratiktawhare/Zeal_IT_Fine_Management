/**
 * ===========================================
 * Report Routes
 * ===========================================
 * Routes for generating various reports
 */

const express = require('express');
const router = express.Router();
const {
    getStudentPayments,
    getTransactions
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// ===========================================
// All report routes require authentication
// ===========================================
router.use(protect);

/**
 * @route   GET /api/reports/student-payments
 * @desc    Get student payments summary with aggregation
 * @access  Private
 * 
 * Query Parameters:
 * - type: 'fee', 'fine', or 'both' (default: both)
 * - year: Academic year filter
 * - division: Division filter
 * - search: Search by name or PRN
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 */
router.get('/student-payments', getStudentPayments);

/**
 * @route   GET /api/reports/transactions
 * @desc    Get all transactions (combined income + expenditure)
 * @access  Private
 * 
 * Query Parameters:
 * - type: 'income', 'expenditure', or 'all' (default: all)
 * - paymentType: 'fee', 'fine', or 'all'
 * - category: Category filter
 * - year: Year filter
 * - month: Month filter
 * - fromDate: Start date
 * - toDate: End date
 * - minAmount: Minimum amount
 * - maxAmount: Maximum amount
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 */
router.get('/transactions', getTransactions);

module.exports = router;
