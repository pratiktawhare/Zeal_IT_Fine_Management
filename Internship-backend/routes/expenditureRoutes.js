/**
 * ===========================================
 * Expenditure Routes
 * ===========================================
 * Routes for managing department expenditures
 * and financial summaries
 */

const express = require('express');
const router = express.Router();
const {
    addExpenditure,
    getFinancialSummary,
    getAllExpenditures,
    getExpenditureById,
    updateExpenditure,
    deleteExpenditure,
    getMonthlyReport,
    getExpenditureReport
} = require('../controllers/expenditureController');
const { protect } = require('../middleware/authMiddleware');

// ===========================================
// All expenditure routes require authentication
// ===========================================
router.use(protect);

/**
 * @route   POST /api/expenditure/add
 * @desc    Add new expenditure
 * @access  Private
 * 
 * Request Body:
 * {
 *   "amount": 5000,
 *   "description": "New lab equipment",
 *   "category": "equipment", (optional: infrastructure, equipment, stationery, events, maintenance, other)
 *   "department": "Computer Science", (optional)
 *   "date": "2024-01-21", (optional, defaults to now)
 *   "receiptNumber": "REC-001", (optional)
 *   "notes": "For AI lab" (optional)
 * }
 */
router.post('/add', addExpenditure);

/**
 * @route   GET /api/expenditure/summary
 * @desc    Get financial summary (income, expenditure, balance)
 * @access  Private
 * 
 * Returns:
 * - Total income from all fines
 * - Total expenditure
 * - Balance (income - expenditure)
 * - Statistics (student counts, fine counts, etc.)
 * - Expenditure breakdown by category
 */
router.get('/summary', getFinancialSummary);

/**
 * @route   GET /api/expenditure/report/monthly
 * @desc    Get monthly financial report
 * @access  Private
 * 
 * Query Parameters:
 * - year: Year for report (default: current year)
 */
router.get('/report/monthly', getMonthlyReport);

/**
 * @route   GET /api/expenditure/report
 * @desc    Get detailed expenditure report with advanced filters
 * @access  Private
 * 
 * Query Parameters:
 * - year: Filter by year
 * - month: Filter by month (1-12)
 * - fromDate: Start date range
 * - toDate: End date range
 * - category: Filter by category
 * - minAmount: Minimum amount
 * - maxAmount: Maximum amount
 * - sortBy: 'date' or 'amount' (default: date)
 * - sortOrder: 'asc' or 'desc' (default: desc)
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 */
router.get('/report', getExpenditureReport);

/**
 * @route   GET /api/expenditure
 * @desc    Get all expenditures with pagination
 * @access  Private
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 * - category: Filter by category
 * - department: Filter by department
 * - startDate: Filter start date
 * - endDate: Filter end date
 */
router.get('/', getAllExpenditures);

/**
 * @route   GET /api/expenditure/:id
 * @desc    Get expenditure by ID
 * @access  Private
 */
router.get('/:id', getExpenditureById);

/**
 * @route   PUT /api/expenditure/:id
 * @desc    Update expenditure
 * @access  Private
 */
router.put('/:id', updateExpenditure);

/**
 * @route   DELETE /api/expenditure/:id
 * @desc    Delete expenditure
 * @access  Private
 */
router.delete('/:id', deleteExpenditure);

module.exports = router;
