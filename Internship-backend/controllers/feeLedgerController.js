/**
 * ===========================================
 * Fee Ledger Controller
 * ===========================================
 * Handles fee ledger operations including
 * listing, filtering, payments, and summaries
 */

const FeeLedger = require('../models/FeeLedger');
const Student = require('../models/Student');
const PaymentCategory = require('../models/PaymentCategory');
const asyncHandler = require('express-async-handler');
const { sendPaymentReceiptEmail } = require('../utils/emailService');

// ===========================================
// Generate receipt number
// ===========================================
const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCP${year}${month}${random}`;
};

/**
 * @desc    Get all ledger entries with filters
 * @route   GET /api/fee-ledger
 * @access  Private
 * 
 * Query Parameters:
 * - studentClass: Filter by class
 * - division: Filter by division
 * - category: Filter by category ID
 * - status: Filter by status (unpaid, partial, paid)
 * - search: Search by PRN, Roll No, or Name
 * - pendingOnly: Boolean to show only pending fees
 * - page, limit, sortBy, sortOrder
 */
const getLedgerEntries = asyncHandler(async (req, res) => {
    const {
        studentClass,
        division,
        category,
        status,
        search,
        pendingOnly,
        page = 1,
        limit = 20,
        sortBy = 'studentName',
        sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build match conditions
    const matchConditions = { isActive: true };

    if (studentClass) matchConditions.studentClass = { $regex: studentClass, $options: 'i' };
    if (division) matchConditions.studentDivision = { $regex: division, $options: 'i' };
    if (category) matchConditions.category = category;
    if (status) matchConditions.status = status;
    if (pendingOnly === 'true') matchConditions.status = { $in: ['unpaid', 'partial'] };

    // Search functionality
    if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        matchConditions.$or = [
            { studentPRN: searchRegex },
            { studentRollNo: searchRegex },
            { studentName: searchRegex }
        ];
    }

    // Get total count
    const total = await FeeLedger.countDocuments(matchConditions);

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get ledger entries
    const entries = await FeeLedger.find(matchConditions)
        .populate('category', 'name type')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

    // Calculate summary totals for filtered data
    const summaryPipeline = [
        { $match: matchConditions },
        {
            $group: {
                _id: null,
                totalExpected: { $sum: '$totalAmount' },
                totalCollected: { $sum: '$paidAmount' },
                totalPending: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
                totalStudents: { $sum: 1 },
                fullyPaid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
                partiallyPaid: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
                unpaid: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } }
            }
        }
    ];

    const summaryResult = await FeeLedger.aggregate(summaryPipeline);
    const summary = summaryResult.length > 0 ? summaryResult[0] : {
        totalExpected: 0,
        totalCollected: 0,
        totalPending: 0,
        totalStudents: 0,
        fullyPaid: 0,
        partiallyPaid: 0,
        unpaid: 0
    };

    // Get filter options from both ledger entries AND students
    const ledgerFilterOptions = await FeeLedger.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                classes: { $addToSet: '$studentClass' },
                divisions: { $addToSet: '$studentDivision' }
            }
        }
    ]);

    // Also get classes from Student collection (for generating entries)
    const studentFilterOptions = await Student.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                classes: { $addToSet: '$year' },
                divisions: { $addToSet: '$division' }
            }
        }
    ]);

    // Merge classes and divisions from both sources
    const ledgerClasses = ledgerFilterOptions[0]?.classes?.filter(c => c) || [];
    const studentClasses = studentFilterOptions[0]?.classes?.filter(c => c) || [];
    const allClasses = [...new Set([...ledgerClasses, ...studentClasses])].sort();

    const ledgerDivisions = ledgerFilterOptions[0]?.divisions?.filter(d => d) || [];
    const studentDivisions = studentFilterOptions[0]?.divisions?.filter(d => d) || [];
    const allDivisions = [...new Set([...ledgerDivisions, ...studentDivisions])].sort();

    const categories = await PaymentCategory.find({ isActive: true }).select('_id name type amount');

    // Get unique "Ledger Batches" (combinations of Category + Class + Year)
    const availableLedgers = await FeeLedger.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: {
                    category: '$category',
                    categoryName: '$categoryName',
                    class: '$studentClass',
                    year: '$academicYear'
                }
            }
        },
        { $sort: { '_id.year': -1, '_id.class': 1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            entries,
            summary,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalEntries: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            },
            filterOptions: {
                classes: allClasses,
                divisions: allDivisions,
                categories,
                ledgers: availableLedgers.map(l => l._id)
            }
        }
    });
});

/**
 * @desc    Get class-wise summary
 * @route   GET /api/fee-ledger/class-summary
 * @access  Private
 */
const getClassSummary = asyncHandler(async (req, res) => {
    const { category, academicYear } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (academicYear) filters.academicYear = academicYear;

    const summary = await FeeLedger.getClassSummary(filters);

    // Calculate overall totals
    const overall = summary.reduce((acc, item) => ({
        totalStudents: acc.totalStudents + item.totalStudents,
        fullyPaid: acc.fullyPaid + item.fullyPaid,
        partiallyPaid: acc.partiallyPaid + item.partiallyPaid,
        unpaid: acc.unpaid + item.unpaid,
        totalExpected: acc.totalExpected + item.totalExpected,
        totalCollected: acc.totalCollected + item.totalCollected,
        totalPending: acc.totalPending + item.totalPending
    }), {
        totalStudents: 0,
        fullyPaid: 0,
        partiallyPaid: 0,
        unpaid: 0,
        totalExpected: 0,
        totalCollected: 0,
        totalPending: 0
    });

    res.status(200).json({
        success: true,
        data: {
            classSummary: summary,
            overall
        }
    });
});

/**
 * @desc    Add payment to a ledger entry
 * @route   POST /api/fee-ledger/:id/pay
 * @access  Private
 * 
 * Request Body:
 * { amount, paymentMode, remarks }
 */
const addPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { amount, paymentMode = 'cash', remarks, sendEmail = true } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid payment amount');
    }

    const ledgerEntry = await FeeLedger.findById(id);

    if (!ledgerEntry) {
        res.status(404);
        throw new Error('Ledger entry not found');
    }

    if (!ledgerEntry.isActive) {
        res.status(400);
        throw new Error('This ledger entry is no longer active');
    }

    const remaining = ledgerEntry.totalAmount - ledgerEntry.paidAmount;
    if (amount > remaining) {
        res.status(400);
        throw new Error(`Payment amount exceeds remaining balance of ₹${remaining}`);
    }

    // Add payment
    const payment = {
        amount: parseFloat(amount),
        paymentMode,
        remarks,
        receiptNumber: generateReceiptNumber(),
        date: new Date()
    };

    ledgerEntry.payments.push(payment);
    await ledgerEntry.save(); // Pre-save middleware will update paidAmount and status

    // Also add to student's fines for Transaction Report compatibility
    const student = await Student.findById(ledgerEntry.student);
    if (student) {
        student.fines.push({
            amount: parseFloat(amount),
            reason: `${ledgerEntry.categoryName} Payment`,
            type: 'fee',
            category: ledgerEntry.categoryName,
            receiptNumber: payment.receiptNumber,
            date: payment.date,
            isPaid: true,
            paidDate: payment.date
        });
        await student.save();

        await student.save();

        // Send email receipt (async, don't wait) - only if sendEmail is true
        if (sendEmail) {
            sendPaymentReceiptEmail(student, {
                receiptNumber: payment.receiptNumber,
                amount: payment.amount,
                type: 'fee',
                category: ledgerEntry.categoryName,
                reason: `${ledgerEntry.categoryName} Payment`,
                createdAt: payment.date
            }).catch(err => console.log('Email send failed:', err.message));
        }
    }

    res.status(200).json({
        success: true,
        message: 'Payment recorded successfully',
        data: {
            ledgerEntry,
            payment,
            newStatus: ledgerEntry.status,
            remainingAmount: ledgerEntry.totalAmount - ledgerEntry.paidAmount
        }
    });
});

/**
 * @desc    Generate ledger entries for a category
 * @route   POST /api/fee-ledger/generate
 * @access  Private
 * 
 * Request Body:
 * { categoryId, classes (optional - uses category's applicableClasses if not provided) }
 */
const generateLedgerEntries = asyncHandler(async (req, res) => {
    const { categoryId, classes, academicYear, amount } = req.body;

    if (!categoryId) {
        res.status(400);
        throw new Error('Category ID is required');
    }

    const category = await PaymentCategory.findById(categoryId);
    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    // Use provided classes or category's applicable classes
    const targetClasses = classes || category.applicableClasses;

    if (!targetClasses || targetClasses.length === 0) {
        res.status(400);
        throw new Error('No classes specified for ledger generation');
    }

    // Use provided amount or fall back to category's default amount
    const feeAmount = amount ? parseFloat(amount) : category.amount;

    if (!feeAmount || feeAmount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid fee amount');
    }

    // Find all students in target classes
    const students = await Student.find({
        year: { $in: targetClasses },
        isActive: true
    });

    if (students.length === 0) {
        res.status(404);
        throw new Error('No students found in specified classes');
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const student of students) {
        try {
            // Check if entry already exists
            const existing = await FeeLedger.findOne({
                student: student._id,
                category: category._id
            });

            if (existing) {
                skipped++;
                continue;
            }

            // Create new ledger entry with the specified amount
            await FeeLedger.create({
                student: student._id,
                category: category._id,
                studentPRN: student.prn,
                studentName: student.name,
                studentRollNo: student.rollNo,
                studentClass: student.year,
                studentDivision: student.division,
                categoryName: category.name,
                totalAmount: feeAmount,
                academicYear: academicYear || student.academicYear,
                paidAmount: 0,
                status: 'unpaid'
            });

            created++;
        } catch (err) {
            errors.push({ prn: student.prn, error: err.message });
        }
    }

    res.status(200).json({
        success: true,
        message: `Ledger entries generated successfully`,
        data: {
            category: category.name,
            targetClasses,
            studentsFound: students.length,
            entriesCreated: created,
            entriesSkipped: skipped,
            errors: errors.length > 0 ? errors : undefined
        }
    });
});

/**
 * @desc    Get single ledger entry with payment history
 * @route   GET /api/fee-ledger/:id
 * @access  Private
 */
const getLedgerEntry = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const entry = await FeeLedger.findById(id)
        .populate('student', 'prn name email phone')
        .populate('category', 'name type description');

    if (!entry) {
        res.status(404);
        throw new Error('Ledger entry not found');
    }

    res.status(200).json({
        success: true,
        data: entry
    });
});

/**
 * @desc    Delete ledger entries (admin only)
 * @route   DELETE /api/fee-ledger/:id
 * @access  Private
 */
const deleteLedgerEntry = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const entry = await FeeLedger.findById(id);

    if (!entry) {
        res.status(404);
        throw new Error('Ledger entry not found');
    }

    if (entry.paidAmount > 0) {
        res.status(400);
        throw new Error('Cannot delete ledger entry with existing payments');
    }

    await FeeLedger.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: 'Ledger entry deleted successfully'
    });
});

/**
 * @desc    Bulk delete ledger entries by class (only unpaid entries)
 * @route   DELETE /api/fee-ledger/bulk-delete
 * @access  Private
 * 
 * Request Body:
 * { studentClass, category (optional), includeWithPayments (optional) }
 */
const bulkDeleteLedgerEntries = asyncHandler(async (req, res) => {
    const { studentClass, category, includeWithPayments = false } = req.body;

    if (!studentClass) {
        res.status(400);
        throw new Error('Please specify a class to delete');
    }

    // Build filter
    const filter = {
        studentClass: { $regex: studentClass, $options: 'i' }
    };

    if (category) {
        filter.category = category;
    }

    // If not including entries with payments, only delete unpaid
    if (!includeWithPayments) {
        filter.paidAmount = 0;
    }

    // Get all entries that will be deleted (need receipt numbers to clean up student fines)
    const entriesToDelete = await FeeLedger.find(filter).select('student payments categoryName');

    if (entriesToDelete.length === 0) {
        res.status(404);
        throw new Error('No ledger entries found for the specified criteria');
    }

    // Collect all receipt numbers from payments to remove from student fines
    const receiptNumbers = [];
    const studentUpdates = {};

    entriesToDelete.forEach(entry => {
        if (entry.payments && entry.payments.length > 0) {
            entry.payments.forEach(payment => {
                if (payment.receiptNumber) {
                    receiptNumbers.push(payment.receiptNumber);

                    // Track student updates
                    const studentId = entry.student.toString();
                    if (!studentUpdates[studentId]) {
                        studentUpdates[studentId] = [];
                    }
                    studentUpdates[studentId].push(payment.receiptNumber);
                }
            });
        }
    });

    // Remove corresponding entries from student fines - DISABLED per user request
    // We want to keep the transaction history even if the ledger bill is deleted
    /*
    if (receiptNumbers.length > 0) {
        // Use updateMany to remove fines with matching receipt numbers
        const updateResult = await Student.updateMany(
            { 'fines.receiptNumber': { $in: receiptNumbers } },
            { $pull: { fines: { receiptNumber: { $in: receiptNumbers } } } }
        );
        finesRemoved = receiptNumbers.length;
    }
    */
    // Reset finesRemoved since we aren't removing them
    finesRemoved = 0;

    // Perform bulk delete of ledger entries
    const result = await FeeLedger.deleteMany(filter);

    // Count entries that weren't deleted (if not including paid)
    let skippedCount = 0;
    if (!includeWithPayments) {
        const baseFilter = {
            studentClass: { $regex: studentClass, $options: 'i' },
            paidAmount: { $gt: 0 }
        };
        if (category) {
            baseFilter.category = category;
        }
        skippedCount = await FeeLedger.countDocuments(baseFilter);
    }

    res.status(200).json({
        success: true,
        message: `Deleted ${result.deletedCount} ledger entries for ${studentClass}`,
        data: {
            deletedCount: result.deletedCount,
            finesRemoved,
            skippedCount,
            skippedReason: skippedCount > 0 ? 'Entries with payments were skipped (use includeWithPayments to delete them)' : null
        }
    });
});

/**
 * @desc    Get available options for bulk delete (only unpaid entries)
 * @route   GET /api/fee-ledger/deletable-options
 * @access  Private
 */
const getDeletableOptions = asyncHandler(async (req, res) => {
    // Get classes and categories that have unpaid entries (paidAmount === 0)
    const result = await FeeLedger.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                classes: { $addToSet: '$studentClass' },
                categoryIds: { $addToSet: '$category' }
            }
        }
    ]);

    if (result.length === 0) {
        return res.status(200).json({
            success: true,
            data: {
                classes: [],
                categories: []
            }
        });
    }

    // Get category details for the IDs found
    const categoryIds = result[0].categoryIds.filter(id => id);
    const categories = await PaymentCategory.find({
        _id: { $in: categoryIds },
        isActive: true
    }).select('_id name');

    res.status(200).json({
        success: true,
        data: {
            classes: result[0].classes.filter(c => c).sort(),
            categories: categories
        }
    });
});

module.exports = {
    getLedgerEntries,
    getClassSummary,
    addPayment,
    generateLedgerEntries,
    getLedgerEntry,
    deleteLedgerEntry,
    bulkDeleteLedgerEntries,
    getDeletableOptions
};
