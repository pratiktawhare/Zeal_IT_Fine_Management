/**
 * ===========================================
 * Fee Ledger Routes
 * ===========================================
 * Routes for fee ledger management
 */

const express = require('express');
const router = express.Router();
const {
    getLedgerEntries,
    getClassSummary,
    addPayment,
    generateLedgerEntries,
    getLedgerEntry,
    deleteLedgerEntry,
    bulkDeleteLedgerEntries,
    getDeletableOptions,
    getStudentLedgers
} = require('../controllers/feeLedgerController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

/**
 * @route   GET /api/fee-ledger
 * @desc    Get all ledger entries with filters
 * @access  Private
 * 
 * Query Params:
 * - studentClass: Filter by class
 * - division: Filter by division
 * - category: Filter by category ID
 * - status: unpaid | partial | paid
 * - search: Search by PRN, Roll No, Name
 * - pendingOnly: Boolean for pending fees only
 * - page, limit, sortBy, sortOrder
 */
router.get('/', getLedgerEntries);

/**
 * @route   GET /api/fee-ledger/class-summary
 * @desc    Get class-wise summary
 * @access  Private
 */
router.get('/class-summary', getClassSummary);

/**
 * @route   GET /api/fee-ledger/deletable-options
 * @desc    Get classes and categories with unpaid entries (for delete modal)
 * @access  Private
 */
router.get('/deletable-options', getDeletableOptions);

/**
 * @route   POST /api/fee-ledger/generate
 * @desc    Generate ledger entries for a category
 * @access  Private
 * 
 * Request Body:
 * { categoryId, classes (optional), academicYear (optional) }
 */
router.post('/generate', generateLedgerEntries);

/**
 * @route   DELETE /api/fee-ledger/bulk-delete
 * @desc    Bulk delete ledger entries by class (only unpaid)
 * @access  Private
 * 
 * Request Body:
 * { studentClass, category (optional) }
 */
router.delete('/bulk-delete', bulkDeleteLedgerEntries);

/**
 * @route   GET /api/fee-ledger/:id
 * @desc    Get single ledger entry with payment history
 * @access  Private
 */
router.get('/:id', getLedgerEntry);

/**
 * @route   POST /api/fee-ledger/:id/pay
 * @desc    Add payment to a ledger entry
 * @access  Private
 * 
 * Request Body:
 * { amount, paymentMode, remarks }
 */
router.post('/:id/pay', addPayment);

/**
 * @route   DELETE /api/fee-ledger/:id
 * @desc    Delete a ledger entry (only if no payments)
 * @access  Private
 */
router.delete('/:id', deleteLedgerEntry);

/**
 * @route   GET /api/fee-ledger/student/:prn
 * @desc    Get all ledger entries for a specific student
 * @access  Private
 */
router.get('/student/:prn', getStudentLedgers);

module.exports = router;
