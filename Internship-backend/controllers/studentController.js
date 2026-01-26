/**
 * ===========================================
 * Student Controller
 * ===========================================
 * Handles student-related operations including
 * CSV upload, search, and fine management
 */

const fs = require('fs');
const csv = require('csv-parser');
const Student = require('../models/Student');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sendPaymentReceiptEmail } = require('../utils/emailService');

/**
 * @desc    Upload students from CSV file
 * @route   POST /api/students/upload-csv
 * @access  Private
 * 
 * CSV Format Expected:
 * prn,name,department,email,phone
 * 
 * This endpoint inserts new students or updates existing ones based on PRN
 */
const uploadStudentsCSV = asyncHandler(async (req, res) => {
    // Check if file was uploaded
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a CSV file');
    }

    const filePath = req.file.path;
    const results = [];
    const errors = [];
    let successCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    // Read the file content to detect the header row
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim());

    // Find the row that contains actual headers (must have "PRN" in it)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const lineLower = lines[i].toLowerCase();
        if (lineLower.includes('prn') && (lineLower.includes('name') || lineLower.includes('student'))) {
            headerRowIndex = i;
            console.log(`Found header row at line ${i + 1}: ${lines[i].substring(0, 100)}...`);
            break;
        }
    }

    // Create modified CSV content starting from the header row
    const modifiedContent = lines.slice(headerRowIndex).join('\n');

    // Create a promise to handle CSV parsing from the modified content
    const parseCSV = new Promise((resolve, reject) => {
        const stream = require('stream');
        const readable = new stream.Readable();
        readable.push(modifiedContent);
        readable.push(null);

        readable
            .pipe(csv({
                // Handle different header variations - normalize to lowercase and remove special chars
                mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/[.\s]+/g, ' ').trim()
            }))
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error) => {
                reject(error);
            });
    });

    try {
        // Wait for CSV parsing to complete
        await parseCSV;

        // Log first row keys for debugging
        if (results.length > 0) {
            console.log('CSV Headers detected:', Object.keys(results[0]));
            console.log('First row data:', results[0]);
        }

        // Helper function to find value by partial key match
        const getValue = (row, ...possibleKeys) => {
            for (const key of possibleKeys) {
                // Try exact match first
                if (row[key] !== undefined) return row[key]?.trim();
                // Try partial match
                const rowKeys = Object.keys(row);
                for (const rowKey of rowKeys) {
                    if (rowKey.includes(key) || key.includes(rowKey)) {
                        return row[rowKey]?.trim();
                    }
                }
            }
            return undefined;
        };

        // Process each row
        for (const row of results) {
            try {
                // Extract and validate data from CSV format using flexible matching
                const prn = getValue(row, 'prn number', 'prn', 'prnnumber')?.toUpperCase();
                const name = getValue(row, 'student name', 'name', 'studentname');
                const academicYear = getValue(row, 'academic year', 'academicyear');
                const semester = getValue(row, 'semester');
                const year = getValue(row, 'year');
                const division = getValue(row, 'division');
                const rollNo = getValue(row, 'roll no', 'rollno', 'roll');
                const phone = getValue(row, 'mobile number', 'mobile', 'phone');
                const email = getValue(row, 'email id', 'email', 'emailid');

                // Skip rows with missing required fields (PRN and Name are required)
                if (!prn || !name) {
                    console.log('Skipping row - missing PRN or Name:', { prn, name, row });
                    errors.push({
                        prn: prn || 'N/A',
                        error: 'Missing required fields (PRN Number or Student Name)'
                    });
                    errorCount++;
                    continue;
                }

                // Prepare student data
                const studentData = {
                    prn: prn,
                    name: name,
                    academicYear: academicYear || undefined,
                    semester: semester || undefined,
                    year: year || undefined,
                    division: division || undefined,
                    rollNo: rollNo || undefined,
                    department: division || undefined,
                    email: email || undefined,
                    phone: phone || undefined
                };

                console.log('Processing student:', prn, name);

                // Check if student already exists
                const existingStudent = await Student.findOne({ prn: prn });

                if (existingStudent) {
                    // Update existing student (don't overwrite fines)
                    existingStudent.name = studentData.name;
                    if (studentData.academicYear) existingStudent.academicYear = studentData.academicYear;
                    if (studentData.semester) existingStudent.semester = studentData.semester;
                    if (studentData.year) existingStudent.year = studentData.year;
                    if (studentData.division) existingStudent.division = studentData.division;
                    if (studentData.rollNo) existingStudent.rollNo = studentData.rollNo;
                    if (studentData.department) existingStudent.department = studentData.department;
                    if (studentData.email) existingStudent.email = studentData.email;
                    if (studentData.phone) existingStudent.phone = studentData.phone;
                    await existingStudent.save();
                    updateCount++;
                } else {
                    // Create new student
                    await Student.create(studentData);
                    successCount++;
                }

            } catch (error) {
                errors.push({
                    prn: row.prn || 'Unknown',
                    error: error.message
                });
                errorCount++;
            }
        }

        // Delete the uploaded file after processing
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
        });

        // Send response
        res.status(200).json({
            success: true,
            message: 'CSV file processed successfully',
            data: {
                totalRecords: results.length,
                newStudents: successCount,
                updatedStudents: updateCount,
                errors: errorCount,
                errorDetails: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        // Clean up file on error
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
        });
        throw error;
    }
});

/**
 * @desc    Search student by PRN
 * @route   GET /api/students/search/:prn
 * @access  Private
 * 
 * Returns student details with full fine history
 */
const searchStudentByPRN = asyncHandler(async (req, res) => {
    const { prn } = req.params;

    if (!prn) {
        res.status(400);
        throw new Error('Please provide a PRN to search');
    }

    // Find student by PRN (uppercase for consistency)
    const student = await Student.findOne({ prn: prn.toUpperCase() });

    if (!student) {
        res.status(404);
        throw new Error(`Student with PRN ${prn.toUpperCase()} not found`);
    }

    res.status(200).json({
        success: true,
        data: student
    });
});

/**
 * @desc    Get student by PRN (alias for search)
 * @route   GET /api/students/:prn
 * @access  Private
 */
const getStudentByPRN = asyncHandler(async (req, res) => {
    const { prn } = req.params;

    const student = await Student.findOne({ prn: prn.toUpperCase() });

    if (!student) {
        res.status(404);
        throw new Error(`Student with PRN ${prn.toUpperCase()} not found`);
    }

    res.status(200).json({
        success: true,
        data: student
    });
});

/**
 * @desc    Add payment (fine/fee) to student
 * @route   POST /api/students/add-fine/:prn
 * @access  Private
 * 
 * Request Body: { amount, reason (optional), type, category, date (optional) }
 */
const addFineToStudent = asyncHandler(async (req, res) => {
    const { prn } = req.params;
    const { amount, reason, type, category, date, sendEmail = true } = req.body;

    // Validate required fields (only amount is required now)
    if (!amount) {
        res.status(400);
        throw new Error('Please provide payment amount');
    }

    // Validate amount
    if (isNaN(amount) || Number(amount) <= 0) {
        res.status(400);
        throw new Error('Payment amount must be a positive number');
    }

    // Find student
    const student = await Student.findOne({ prn: prn.toUpperCase() });

    if (!student) {
        res.status(404);
        throw new Error(`Student with PRN ${prn.toUpperCase()} not found`);
    }

    // Generate receipt number: RCP-YYYYMMDD-XXXXX (random 5 digits)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const receiptNumber = `RCP-${dateStr}-${randomNum}`;

    // Add payment to student's fines array
    const newPayment = {
        amount: Number(amount),
        reason: reason?.trim() || '',
        type: type || 'fine',
        category: category || 'Others',
        receiptNumber: receiptNumber,
        date: date ? new Date(date) : new Date(),
        isPaid: true,
        paidDate: new Date()
    };

    student.fines.push(newPayment);
    await student.save();

    // Get the saved payment with _id
    const savedPayment = student.fines[student.fines.length - 1];

    // Send email receipt to student (async, don't wait) - only if sendEmail is true
    if (sendEmail) {
        sendPaymentReceiptEmail(student, savedPayment).catch(err => {
            console.error('Email sending failed:', err.message);
        });
    }

    res.status(201).json({
        success: true,
        message: 'Payment added successfully',
        data: {
            student: {
                prn: student.prn,
                name: student.name,
                department: student.department,
                email: student.email
            },
            payment: savedPayment,
            receiptNumber: receiptNumber,
            totalFines: student.totalFines,
            paymentCount: student.fines.length,
            emailSent: !!student.email
        }
    });
});

/**
 * @desc    Get all students with pagination
 * @route   GET /api/students
 * @access  Private
 */
const getAllStudents = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.department) {
        filter.department = { $regex: req.query.department, $options: 'i' };
    }
    if (req.query.hasFines === 'true') {
        filter['fines.0'] = { $exists: true };
    }

    // Get total count for pagination
    const total = await Student.countDocuments(filter);

    // Get students
    const students = await Student.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-fines'); // Exclude fines array for list view

    res.status(200).json({
        success: true,
        data: {
            students: students,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalStudents: total,
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1
            }
        }
    });
});

/**
 * @desc    Get student fine history
 * @route   GET /api/students/:prn/fines
 * @access  Private
 */
const getStudentFines = asyncHandler(async (req, res) => {
    const { prn } = req.params;

    const student = await Student.findOne({ prn: prn.toUpperCase() });

    if (!student) {
        res.status(404);
        throw new Error(`Student with PRN ${prn.toUpperCase()} not found`);
    }

    // Sort fines by date (newest first)
    const sortedFines = student.fines.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
        success: true,
        data: {
            student: {
                prn: student.prn,
                name: student.name,
                department: student.department
            },
            fines: sortedFines,
            summary: {
                totalFines: student.totalFines,
                fineCount: student.fines.length,
                unpaidFines: student.unpaidFines
            }
        }
    });
});

/**
 * @desc    Mark fine as paid
 * @route   PUT /api/students/:prn/fines/:fineId/pay
 * @access  Private
 */
const markFineAsPaid = asyncHandler(async (req, res) => {
    const { prn, fineId } = req.params;

    const student = await Student.findOne({ prn: prn.toUpperCase() });

    if (!student) {
        res.status(404);
        throw new Error(`Student with PRN ${prn.toUpperCase()} not found`);
    }

    // Find the fine
    const fine = student.fines.id(fineId);

    if (!fine) {
        res.status(404);
        throw new Error('Fine not found');
    }

    // Mark as paid
    fine.isPaid = true;
    fine.paidDate = new Date();
    await student.save();

    res.status(200).json({
        success: true,
        message: 'Fine marked as paid',
        data: fine
    });
});

/**
 * @desc    Delete a student
 * @route   DELETE /api/students/:prn
 * @access  Private
 */
const deleteStudent = asyncHandler(async (req, res) => {
    const { prn } = req.params;

    const student = await Student.findOneAndDelete({ prn: prn.toUpperCase() });

    if (!student) {
        res.status(404);
        throw new Error(`Student with PRN ${prn.toUpperCase()} not found`);
    }

    res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
        data: {
            prn: student.prn,
            name: student.name
        }
    });
});

/**
 * @desc    Add a new student (single)
 * @route   POST /api/students/add
 * @access  Private
 */
const addStudent = asyncHandler(async (req, res) => {
    const { prn, name, department, academicYear, semester, year, division, rollNo, email, phone } = req.body;

    // Validate required fields
    if (!prn || !name) {
        res.status(400);
        throw new Error('Please provide PRN and Name');
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ prn: prn.toUpperCase() });
    if (existingStudent) {
        res.status(400);
        throw new Error(`Student with PRN ${prn.toUpperCase()} already exists`);
    }

    // Create new student
    const student = await Student.create({
        prn: prn.toUpperCase(),
        name: name.trim(),
        department: department?.trim(),
        academicYear: academicYear?.trim(),
        semester: semester?.trim(),
        year: year?.trim(),
        division: division?.trim(),
        rollNo: rollNo?.trim(),
        email: email?.trim()?.toLowerCase(),
        phone: phone?.trim()
    });

    res.status(201).json({
        success: true,
        message: 'Student added successfully',
        data: student
    });
});

/**
 * @desc    Update student details
 * @route   PUT /api/students/:prn
 * @access  Private
 */
const updateStudent = asyncHandler(async (req, res) => {
    const { prn } = req.params;
    const { name, department, academicYear, semester, year, division, rollNo, email, phone } = req.body;

    const student = await Student.findOne({ prn: prn.toUpperCase() });

    if (!student) {
        res.status(404);
        throw new Error(`Student with PRN ${prn.toUpperCase()} not found`);
    }

    // Update fields if provided
    if (name) student.name = name.trim();
    if (department !== undefined) student.department = department?.trim();
    if (academicYear !== undefined) student.academicYear = academicYear?.trim();
    if (semester !== undefined) student.semester = semester?.trim();
    if (year !== undefined) student.year = year?.trim();
    if (division !== undefined) student.division = division?.trim();
    if (rollNo !== undefined) student.rollNo = rollNo?.trim();
    if (email !== undefined) student.email = email?.trim()?.toLowerCase();
    if (phone !== undefined) student.phone = phone?.trim();

    await student.save();

    res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student
    });
});

/**
 * @desc    Delete all students by division
 * @route   DELETE /api/students/division/:division
 * @access  Private
 */
const deleteStudentsByDivision = asyncHandler(async (req, res) => {
    const { division } = req.params;

    if (!division) {
        res.status(400);
        throw new Error('Please provide a division');
    }

    const result = await Student.deleteMany({
        division: { $regex: new RegExp(`^${division}$`, 'i') }
    });

    if (result.deletedCount === 0) {
        res.status(404);
        throw new Error(`No students found in division ${division}`);
    }

    res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} students from division ${division}`,
        data: {
            deletedCount: result.deletedCount
        }
    });
});

/**
 * @desc    Delete all students by year
 * @route   DELETE /api/students/year/:year
 * @access  Private
 */
const deleteStudentsByYear = asyncHandler(async (req, res) => {
    const { year } = req.params;

    if (!year) {
        res.status(400);
        throw new Error('Please provide a year');
    }

    const result = await Student.deleteMany({
        year: { $regex: new RegExp(`^${year}$`, 'i') }
    });

    if (result.deletedCount === 0) {
        res.status(404);
        throw new Error(`No students found in year ${year}`);
    }

    res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} students from year ${year}`,
        data: {
            deletedCount: result.deletedCount
        }
    });
});

/**
 * @desc    Get all students with advanced filters and payment summary
 * @route   GET /api/students/management
 * @access  Private
 */
const getAllStudentsAdvanced = asyncHandler(async (req, res) => {
    const {
        year,
        division,
        paymentType,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        page = 1,
        limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build match conditions
    const matchConditions = { isActive: true };
    if (year) matchConditions.year = { $regex: year, $options: 'i' };
    if (division) matchConditions.division = { $regex: division, $options: 'i' };
    if (search) {
        matchConditions.$or = [
            { prn: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
        ];
    }

    // Aggregation pipeline
    const pipeline = [
        { $match: matchConditions },
        {
            $project: {
                prn: 1,
                rollNo: 1,
                name: 1,
                year: 1,
                division: 1,
                email: 1,
                phone: 1,
                department: 1,
                academicYear: 1,
                semester: 1,
                rollNo: 1,
                createdAt: 1,
                feesPaid: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$fines', cond: { $eq: ['$$this.type', 'fee'] } } },
                            as: 'f',
                            in: '$$f.amount'
                        }
                    }
                },
                finePaid: {
                    $sum: {
                        $map: {
                            input: { $filter: { input: '$fines', cond: { $eq: ['$$this.type', 'fine'] } } },
                            as: 'f',
                            in: '$$f.amount'
                        }
                    }
                },
                totalPaid: { $sum: '$fines.amount' }
            }
        }
    ];

    // Filter by payment type
    if (paymentType === 'fee') {
        pipeline.push({ $match: { feesPaid: { $gt: 0 } } });
    } else if (paymentType === 'fine') {
        pipeline.push({ $match: { finePaid: { $gt: 0 } } });
    }

    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Student.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortOptions });

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

    const students = await Student.aggregate(pipeline);

    // Get unique years and divisions for filters
    const filterOptions = await Student.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                years: { $addToSet: '$year' },
                divisions: { $addToSet: '$division' }
            }
        }
    ]);

    res.status(200).json({
        success: true,
        data: {
            students,
            filterOptions: filterOptions.length > 0 ? {
                years: filterOptions[0].years.filter(y => y).sort(),
                divisions: filterOptions[0].divisions.filter(d => d).sort()
            } : { years: [], divisions: [] },
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
 * @desc    Delete all students by year and division (Class)
 * @route   DELETE /api/students/class
 * @access  Private
 */
const deleteStudentsByClass = asyncHandler(async (req, res) => {
    const { year, division } = req.body;

    if (!year || !division) {
        res.status(400);
        throw new Error('Please provide both year and division');
    }

    const result = await Student.deleteMany({
        year: { $regex: new RegExp(`^${year}$`, 'i') },
        division: { $regex: new RegExp(`^${division}$`, 'i') }
    });

    if (result.deletedCount === 0) {
        res.status(404);
        throw new Error(`No students found in ${year} division ${division}`);
    }

    res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} students from ${year} division ${division}`,
        data: {
            deletedCount: result.deletedCount
        }
    });
});

module.exports = {
    uploadStudentsCSV,
    searchStudentByPRN,
    getStudentByPRN,
    addFineToStudent,
    getAllStudents,
    getStudentFines,
    markFineAsPaid,
    deleteStudent,
    addStudent,
    updateStudent,
    deleteStudentsByDivision,
    deleteStudentsByYear,
    deleteStudentsByClass,
    getAllStudentsAdvanced
};

