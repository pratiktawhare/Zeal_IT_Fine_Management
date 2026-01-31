/**
 * ===========================================
 * Report Controller
 * ===========================================
 * Handles report generation for student payments
 * and combined transaction ledger
 */

const Student = require('../models/Student');
const Expenditure = require('../models/Expenditure');
const { asyncHandler } = require('../middleware/errorMiddleware');

/**
 * @desc    Get student payments summary (aggregated)
 * @route   GET /api/reports/student-payments
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
const getStudentPayments = asyncHandler(async (req, res) => {
    const { type, year, division, search, page = 1, limit = 10, sortBy = 'totalAmount', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build match conditions for students
    const matchConditions = { isActive: true };
    if (year) matchConditions.year = year;
    if (division) matchConditions.division = { $regex: division, $options: 'i' };
    if (search) {
        matchConditions.$or = [
            { prn: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
        ];
    }

    // Build payment type filter for aggregation
    let fineMatchCondition = {};
    if (type === 'fee') {
        fineMatchCondition = { 'fines.type': 'fee' };
    } else if (type === 'fine') {
        fineMatchCondition = { 'fines.type': 'fine' };
    }

    // Aggregation pipeline
    const pipeline = [
        { $match: matchConditions },
        { $match: { 'fines.0': { $exists: true } } }, // Only students with payments
        {
            $project: {
                prn: 1,
                rollNo: 1,
                name: 1,
                year: 1,
                division: 1,
                email: 1,
                fines: 1,
                totalFeesPaid: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$fines', cond: { $eq: ['$$this.type', 'fee'] } } },
                            as: 'f',
                            in: '$$f.amount'
                        }
                    }
                },
                totalFinePaid: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$fines', cond: { $eq: ['$$this.type', 'fine'] } } },
                            as: 'f',
                            in: '$$f.amount'
                        }
                    }
                },
                totalAmount: { $sum: '$fines.amount' }
            }
        }
    ];

    // Filter by payment type after calculation
    if (type === 'fee') {
        pipeline.push({ $match: { totalFeesPaid: { $gt: 0 } } });
    } else if (type === 'fine') {
        pipeline.push({ $match: { totalFinePaid: { $gt: 0 } } });
    }

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Student.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add sorting and pagination
    const sortStage = {};
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Handle specific sort fields
    if (sortBy === 'rollNo') {
        // For mixed type roll numbers (strings/numbers), simple sort works but strings sort alphabetically
        sortStage['rollNo'] = sortDirection;
    } else if (sortBy === 'name') {
        sortStage['name'] = sortDirection;
    } else {
        // Default to totalAmount
        sortStage['totalAmount'] = sortDirection;
    }

    pipeline.push(
        { $sort: sortStage },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
            $project: {
                prn: 1,
                rollNo: 1,
                name: 1,
                year: 1,
                division: 1,
                totalFeesPaid: 1,
                totalFinePaid: 1,
                totalAmount: 1
            }
        }
    );

    const students = await Student.aggregate(pipeline);

    // Calculate grand totals
    const totalsPipeline = [
        { $match: matchConditions },
        { $unwind: '$fines' },
        {
            $group: {
                _id: null,
                grandTotalFees: {
                    $sum: { $cond: [{ $eq: ['$fines.type', 'fee'] }, '$fines.amount', 0] }
                },
                grandTotalFines: {
                    $sum: { $cond: [{ $eq: ['$fines.type', 'fine'] }, '$fines.amount', 0] }
                },
                grandTotal: { $sum: '$fines.amount' }
            }
        }
    ];

    const totalsResult = await Student.aggregate(totalsPipeline);
    const grandTotals = totalsResult.length > 0 ? totalsResult[0] : {
        grandTotalFees: 0,
        grandTotalFines: 0,
        grandTotal: 0
    };

    // Get distinct years and divisions for filters
    const filterOptionsTuple = await Student.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                years: { $addToSet: '$year' },
                divisions: { $addToSet: '$division' }
            }
        }
    ]);

    // Filter out invalid values (like emails containing @)
    const isValid = (val) => val && typeof val === 'string' && !val.includes('@') && val.length < 50;

    const filterOptions = filterOptionsTuple.length > 0 ? {
        years: filterOptionsTuple[0].years.filter(isValid).sort(),
        divisions: filterOptionsTuple[0].divisions.filter(isValid).sort()
    } : { years: [], divisions: [] };

    res.status(200).json({
        success: true,
        data: {
            students,
            grandTotals: {
                totalFees: grandTotals.grandTotalFees,
                totalFines: grandTotals.grandTotalFines,
                totalAmount: grandTotals.grandTotal
            },
            filterOptions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalStudents: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            }
        }
    });
});

/**
 * @desc    Get all transactions (combined income + expenditure)
 * @route   GET /api/reports/transactions
 * @access  Private
 * 
 * Query Parameters:
 * - type: 'income', 'expenditure', or 'all' (default: all)
 * - paymentType: 'fee', 'fine', or 'all' (for income only)
 * - category: Category filter
 * - year: Year filter
 * - month: Month filter (1-12)
 * - fromDate: Start date
 * - toDate: End date
 * - minAmount: Minimum amount
 * - maxAmount: Maximum amount
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 10)
 */
const getTransactions = asyncHandler(async (req, res) => {
    const {
        type = 'all',
        paymentType,
        category,
        year,
        month,
        fromDate,
        toDate,
        minAmount,
        maxAmount,
        page = 1,
        limit = 10,
        sortBy = 'date',
        sortOrder = 'desc',
        division, // Add division filter
        studentClass, // Add class filter
        search // Add search filter
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build date filter
    let dateFilter = {};
    if (year) {
        const startOfYear = new Date(`${year}-01-01`);
        const endOfYear = new Date(`${year}-12-31T23:59:59`);
        dateFilter = { $gte: startOfYear, $lte: endOfYear };
    }
    if (month && year) {
        const startOfMonth = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        dateFilter = { $gte: startOfMonth, $lte: endOfMonth };
    }
    if (fromDate || toDate) {
        dateFilter = {};
        if (fromDate) dateFilter.$gte = new Date(fromDate);
        if (toDate) dateFilter.$lte = new Date(toDate + 'T23:59:59');
    }

    // Amount filter
    let amountFilter = {};
    if (minAmount) amountFilter.$gte = parseFloat(minAmount);
    if (maxAmount) amountFilter.$lte = parseFloat(maxAmount);

    let transactions = [];
    let incomeTotal = 0;
    let expenditureTotal = 0;

    // Get income transactions (from student fines)
    if (type === 'all' || type === 'income') {
        // Build student match for search
        // Build student match for search (Pre-filter students)
        const studentMatch = { isActive: true };
        let searchRegex = null;

        if (search) {
            searchRegex = { $regex: search, $options: 'i' };
            studentMatch.$or = [
                { prn: searchRegex },
                { name: searchRegex },
                { rollNo: searchRegex },
                { 'fines.receiptNumber': searchRegex } // Allow finding student by receipt
            ];
        }

        const incomePipeline = [
            { $match: studentMatch },
            { $unwind: '$fines' },
            {
                $project: {
                    date: '$fines.date',
                    transactionType: { $literal: 'income' },
                    studentPRN: '$prn',
                    studentName: '$name',
                    studentRollNo: '$rollNo',
                    studentDivision: '$division',
                    studentClass: '$year',
                    category: '$fines.category',
                    description: '$fines.reason',
                    amount: '$fines.amount',
                    paymentType: '$fines.type',
                    paymentMode: { $ifNull: ['$fines.paymentMode', 'cash'] },
                    receiptNumber: '$fines.receiptNumber',
                    createdAt: '$fines.createdAt'
                }
            }
        ];

        // Apply filters
        const incomeMatch = {};
        if (Object.keys(dateFilter).length > 0) incomeMatch.date = dateFilter;
        if (Object.keys(amountFilter).length > 0) incomeMatch.amount = amountFilter;
        if (category) incomeMatch.category = { $regex: category, $options: 'i' };
        if (paymentType && paymentType !== 'all') incomeMatch.paymentType = paymentType;
        if (division) incomeMatch.studentDivision = { $regex: division, $options: 'i' };
        if (studentClass) incomeMatch.studentClass = { $regex: studentClass, $options: 'i' };

        // Post-unwind Search Filter
        if (search && searchRegex) {
            incomeMatch.$or = [
                { studentPRN: searchRegex },
                { studentName: searchRegex },
                { studentRollNo: searchRegex },
                { receiptNumber: searchRegex }
            ];
        }

        if (Object.keys(incomeMatch).length > 0) {
            incomePipeline.push({ $match: incomeMatch });
        }

        const incomeTransactions = await Student.aggregate(incomePipeline);
        transactions = [...transactions, ...incomeTransactions];

        // Calculate income total
        incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    }

    // Get expenditure transactions (only if no division filter is applied, as expenditures don't have division)
    if ((type === 'all' || type === 'expenditure') && !division) {
        const expenditureMatch = {};
        if (Object.keys(dateFilter).length > 0) expenditureMatch.date = dateFilter;
        if (Object.keys(amountFilter).length > 0) expenditureMatch.amount = amountFilter;
        if (category) expenditureMatch.category = { $regex: category, $options: 'i' };

        // Apply search to expenditures too
        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            expenditureMatch.$or = [
                { description: searchRegex },
                { receiptNumber: searchRegex },
                { category: searchRegex }
            ];
        }

        const expenditures = await Expenditure.find(expenditureMatch)
            .populate('addedBy', 'name email')
            .lean();

        const expenditureTransactions = expenditures.map(exp => ({
            date: exp.date,
            transactionType: 'expenditure',
            studentPRN: null,
            studentName: null,
            studentDivision: null,
            studentClass: null,
            category: exp.category,
            description: exp.description,
            amount: exp.amount,
            paymentType: null,
            paymentType: null,
            receiptNumber: exp.receiptNumber,
            addedBy: exp.addedBy?.name || 'Unknown',
            createdAt: exp.createdAt
        }));

        transactions = [...transactions, ...expenditureTransactions];

        // Calculate expenditure total
        expenditureTotal = expenditureTransactions.reduce((sum, t) => sum + t.amount, 0);
    }

    // Sort transactions
    const sortMultiplier = sortOrder === 'desc' ? -1 : 1;
    transactions.sort((a, b) => {
        if (sortBy === 'amount') {
            return (a.amount - b.amount) * sortMultiplier;
        }
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return (dateA - dateB) * sortMultiplier;
    });

    // Get total count before pagination
    const total = transactions.length;

    // Apply pagination
    const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

    res.status(200).json({
        success: true,
        data: {
            transactions: paginatedTransactions,
            summary: {
                totalIncome: incomeTotal,
                totalExpenditure: expenditureTotal,
                netBalance: incomeTotal - expenditureTotal
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalTransactions: total,
                hasNextPage: parseInt(page) * parseInt(limit) < total,
                hasPrevPage: parseInt(page) > 1
            },
            filterOptions: await (async () => {
                const studentResult = await Student.aggregate([
                    { $match: { isActive: true } },
                    { $unwind: '$fines' },
                    {
                        $group: {
                            _id: null,
                            divisions: { $addToSet: '$division' },
                            years: { $addToSet: '$year' },
                            categories: { $addToSet: '$fines.category' } // Get fine categories
                        }
                    }
                ]);

                // Get expenditure categories
                const expenditureResult = await Expenditure.distinct('category');

                let categories = [];
                let divisions = [];
                let years = [];

                if (studentResult.length > 0) {
                    divisions = studentResult[0].divisions;
                    years = studentResult[0].years;
                    categories = [...studentResult[0].categories];
                }

                // Merge and dedup categories
                if (expenditureResult.length > 0) {
                    categories = [...new Set([...categories, ...expenditureResult])];
                }

                const categorySort = (a, b) => {
                    if (a === 'Others') return 1;
                    if (b === 'Others') return -1;
                    return a.localeCompare(b);
                };

                // Filter out invalid values (like emails containing @)
                const isValid = (val) => val && typeof val === 'string' && !val.includes('@') && val.length < 50;

                return {
                    divisions: divisions.filter(isValid).sort(),
                    years: years.filter(isValid).sort(),
                    categories: categories.filter(c => c).sort(categorySort),
                    incomeCategories: studentResult.length > 0 ? [...new Set(studentResult[0].categories)].sort(categorySort) : [],
                    expenditureCategories: expenditureResult.filter(c => c).sort(categorySort)
                };
            })()
        }
    });
});

module.exports = {
    getStudentPayments,
    getTransactions
};
