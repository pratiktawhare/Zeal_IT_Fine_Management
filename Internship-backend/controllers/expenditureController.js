/**
 * ===========================================
 * Expenditure Controller
 * ===========================================
 * Handles department expenditure operations
 * and financial summary calculations
 */

const Expenditure = require('../models/Expenditure');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Add new expenditure
 * @route   POST /api/expenditure/add
 * @access  Private
 */
const addExpenditure = asyncHandler(async (req, res) => {
    const { amount, description, category, department, date, receiptNumber, notes } = req.body;

    // Validate required fields
    if (!amount || !description) {
        res.status(400);
        throw new Error('Please provide amount and description');
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
        res.status(400);
        throw new Error('Amount must be a positive number');
    }

    // Create expenditure record
    const expenditure = await Expenditure.create({
        amount: Number(amount),
        description: description.trim(),
        category: category || 'other',
        department: department?.trim(),
        date: date ? new Date(date) : new Date(),
        receiptNumber: receiptNumber?.trim(),
        notes: notes?.trim(),
        addedBy: req.admin._id
    });

    res.status(201).json({
        success: true,
        message: 'Expenditure added successfully',
        data: expenditure
    });
});

/**
 * @desc    Get financial summary (income, expenditure, balance)
 * @route   GET /api/expenditure/summary
 * @access  Private
 * 
 * Returns:
 * - Total Income (sum of all fines)
 * - Total Expenditure (sum of all expenses)
 * - Balance (income - expenditure)
 */
const getFinancialSummary = asyncHandler(async (req, res) => {
    // Calculate total income from all student fines
    const incomeResult = await Student.aggregate([
        { $unwind: { path: '$fines', preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, totalIncome: { $sum: '$fines.amount' } } }
    ]);
    const totalIncome = incomeResult.length > 0 ? incomeResult[0].totalIncome : 0;

    // Calculate total expenditure
    const expenditureResult = await Expenditure.aggregate([
        { $group: { _id: null, totalExpenditure: { $sum: '$amount' } } }
    ]);
    const totalExpenditure = expenditureResult.length > 0 ? expenditureResult[0].totalExpenditure : 0;

    // Calculate balance
    const balance = totalIncome - totalExpenditure;

    // Get additional statistics
    const totalStudents = await Student.countDocuments();
    const studentsWithFines = await Student.countDocuments({ 'fines.0': { $exists: true } });
    const totalFineCount = await Student.aggregate([
        { $project: { fineCount: { $size: '$fines' } } },
        { $group: { _id: null, total: { $sum: '$fineCount' } } }
    ]);
    const totalExpenditureCount = await Expenditure.countDocuments();

    // Get expenditure by category
    const expenditureByCategory = await Expenditure.getSummaryByCategory();

    res.status(200).json({
        success: true,
        data: {
            financial: {
                totalIncome: totalIncome,
                totalExpenditure: totalExpenditure,
                balance: balance,
                status: balance >= 0 ? 'surplus' : 'deficit'
            },
            statistics: {
                totalStudents: totalStudents,
                studentsWithFines: studentsWithFines,
                totalFines: totalFineCount.length > 0 ? totalFineCount[0].total : 0,
                totalExpenditures: totalExpenditureCount
            },
            expenditureByCategory: expenditureByCategory
        }
    });
});

/**
 * @desc    Get all expenditures with pagination
 * @route   GET /api/expenditure
 * @access  Private
 */
const getAllExpenditures = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.category) {
        filter.category = req.query.category;
    }
    if (req.query.department) {
        filter.department = { $regex: req.query.department, $options: 'i' };
    }
    if (req.query.startDate && req.query.endDate) {
        filter.date = {
            $gte: new Date(req.query.startDate),
            $lte: new Date(req.query.endDate)
        };
    }

    // Get total count for pagination
    const total = await Expenditure.countDocuments(filter);

    // Get expenditures
    const expenditures = await Expenditure.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('addedBy', 'name email');

    res.status(200).json({
        success: true,
        data: {
            expenditures: expenditures,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalExpenditures: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        }
    });
});

/**
 * @desc    Get expenditure by ID
 * @route   GET /api/expenditure/:id
 * @access  Private
 */
const getExpenditureById = asyncHandler(async (req, res) => {
    const expenditure = await Expenditure.findById(req.params.id)
        .populate('addedBy', 'name email');

    if (!expenditure) {
        res.status(404);
        throw new Error('Expenditure not found');
    }

    res.status(200).json({
        success: true,
        data: expenditure
    });
});

/**
 * @desc    Update expenditure
 * @route   PUT /api/expenditure/:id
 * @access  Private
 */
const updateExpenditure = asyncHandler(async (req, res) => {
    const { amount, description, category, department, date, receiptNumber, notes } = req.body;

    let expenditure = await Expenditure.findById(req.params.id);

    if (!expenditure) {
        res.status(404);
        throw new Error('Expenditure not found');
    }

    // Update fields if provided
    if (amount !== undefined) {
        if (isNaN(amount) || Number(amount) <= 0) {
            res.status(400);
            throw new Error('Amount must be a positive number');
        }
        expenditure.amount = Number(amount);
    }
    if (description) expenditure.description = description.trim();
    if (category) expenditure.category = category;
    if (department !== undefined) expenditure.department = department?.trim();
    if (date) expenditure.date = new Date(date);
    if (receiptNumber !== undefined) expenditure.receiptNumber = receiptNumber?.trim();
    if (notes !== undefined) expenditure.notes = notes?.trim();

    await expenditure.save();

    res.status(200).json({
        success: true,
        message: 'Expenditure updated successfully',
        data: expenditure
    });
});

/**
 * @desc    Delete expenditure
 * @route   DELETE /api/expenditure/:id
 * @access  Private
 */
const deleteExpenditure = asyncHandler(async (req, res) => {
    const expenditure = await Expenditure.findByIdAndDelete(req.params.id);

    if (!expenditure) {
        res.status(404);
        throw new Error('Expenditure not found');
    }

    res.status(200).json({
        success: true,
        message: 'Expenditure deleted successfully',
        data: {
            id: expenditure._id,
            description: expenditure.description
        }
    });
});

/**
 * @desc    Get monthly financial report
 * @route   GET /api/expenditure/report/monthly
 * @access  Private
 */
const getMonthlyReport = asyncHandler(async (req, res) => {
    // Get year from query or use current year
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Get monthly income (fines)
    const monthlyIncome = await Student.aggregate([
        { $unwind: '$fines' },
        { $match: { 'fines.date': { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
        {
            $group: {
                _id: { month: { $month: '$fines.date' } },
                income: { $sum: '$fines.amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.month': 1 } }
    ]);

    // Get monthly expenditure
    const monthlyExpenditure = await Expenditure.aggregate([
        { $match: { date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
        {
            $group: {
                _id: { month: { $month: '$date' } },
                expenditure: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.month': 1 } }
    ]);

    // Combine into monthly report
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const report = months.map((month, index) => {
        const incomeData = monthlyIncome.find(item => item._id.month === index + 1);
        const expData = monthlyExpenditure.find(item => item._id.month === index + 1);
        const income = incomeData ? incomeData.income : 0;
        const expenditure = expData ? expData.expenditure : 0;

        return {
            month: month,
            monthNumber: index + 1,
            income: income,
            expenditure: expenditure,
            balance: income - expenditure,
            fineCount: incomeData ? incomeData.count : 0,
            expenditureCount: expData ? expData.count : 0
        };
    });

    // Calculate yearly totals
    const yearlyTotals = {
        totalIncome: report.reduce((sum, m) => sum + m.income, 0),
        totalExpenditure: report.reduce((sum, m) => sum + m.expenditure, 0),
        totalBalance: report.reduce((sum, m) => sum + m.balance, 0)
    };

    res.status(200).json({
        success: true,
        data: {
            year: year,
            monthlyReport: report,
            yearlyTotals: yearlyTotals
        }
    });
});

/**
 * @desc    Get detailed expenditure report with advanced filters
 * @route   GET /api/expenditure/report
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
const getExpenditureReport = asyncHandler(async (req, res) => {
    const {
        year,
        month,
        fromDate,
        toDate,
        category,
        minAmount,
        maxAmount,
        sortBy = 'date',
        sortOrder = 'desc',
        page = 1,
        limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = {};

    // Date filters
    if (year && month) {
        const startOfMonth = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (year) {
        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${year}-12-31T23:59:59`);
        filter.date = { $gte: startOfYear, $lte: endOfYear };
    }

    // Date range filter (overrides year/month)
    if (fromDate || toDate) {
        filter.date = {};
        if (fromDate) filter.date.$gte = new Date(fromDate);
        if (toDate) filter.date.$lte = new Date(toDate + 'T23:59:59');
    }

    // Category filter
    if (category) {
        filter.category = category;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = parseFloat(minAmount);
        if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const total = await Expenditure.countDocuments(filter);

    // Get expenditures with pagination
    const expenditures = await Expenditure.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('addedBy', 'name email');

    // Calculate totals for filtered data
    const totalAmountResult = await Expenditure.aggregate([
        { $match: filter },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    const summary = totalAmountResult.length > 0 ? {
        totalAmount: totalAmountResult[0].totalAmount,
        totalRecords: totalAmountResult[0].count
    } : {
        totalAmount: 0,
        totalRecords: 0
    };

    // Get category breakdown for filtered data
    const categoryBreakdown = await Expenditure.aggregate([
        { $match: filter },
        {
            $group: {
                _id: '$category',
                amount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { amount: -1 } }
    ]);

    res.status(200).json({
        success: true,
        data: {
            expenditures: expenditures.map(exp => ({
                _id: exp._id,
                date: exp.date,
                category: exp.category,
                description: exp.description,
                amount: exp.amount,
                addedBy: exp.addedBy?.name || 'Unknown',
                receiptNumber: exp.receiptNumber,
                receiptNumber: exp.receiptNumber,
                notes: exp.notes,
                createdAt: exp.createdAt
            })),
            summary,
            categoryBreakdown,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        }
    });
});

module.exports = {
    addExpenditure,
    getFinancialSummary,
    getAllExpenditures,
    getExpenditureById,
    updateExpenditure,
    deleteExpenditure,
    getMonthlyReport,
    getExpenditureReport
};
