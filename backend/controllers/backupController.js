/**
 * ===========================================
 * Backup Controller
 * ===========================================
 * Handles generating backup files (Excel & PDF)
 * for students and transactions, then uploads
 * them to Google Drive.
 */

const Student = require('../models/Student');
const Expenditure = require('../models/Expenditure');
const { asyncHandler } = require('../middleware/errorMiddleware');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');

// ============================================
// Helper: Format Currency
// ============================================
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount || 0);
};

// ============================================
// Helper: Format Date
// ============================================
const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
};

// ============================================
// Generate Students Excel
// ============================================
const generateStudentsExcel = async (students) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ITSA Accounts';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Students', {
        properties: { defaultColWidth: 18 },
    });

    // Title rows
    sheet.mergeCells('A1:J1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FF1A365D' } };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:J2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = 'STUDENT RECORDS BACKUP';
    subtitleCell.font = { bold: true, size: 12, color: { argb: 'FF2D3748' } };
    subtitleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A3:J3');
    const dateCell = sheet.getCell('A3');
    dateCell.value = `Generated on: ${new Date().toLocaleString('en-IN')}`;
    dateCell.font = { italic: true, size: 10, color: { argb: 'FF718096' } };
    dateCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A4:J4');
    const countCell = sheet.getCell('A4');
    countCell.value = `Total Students: ${students.length}`;
    countCell.font = { bold: true, size: 11 };
    countCell.alignment = { horizontal: 'center' };

    // Empty row
    sheet.addRow([]);

    // Headers
    const headerRow = sheet.addRow([
        'Sr. No', 'PRN', 'Roll No', 'Name', 'Year', 'Division',
        'Department', 'Email', 'Phone', 'Total Payments', 'Payment Count'
    ]);

    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
    const headerFont = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    const headerBorder = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
    };

    headerRow.eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = headerBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Data rows
    const cellBorder = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
    };

    students.forEach((student, index) => {
        const totalPayments = student.fines ? student.fines.reduce((sum, f) => sum + f.amount, 0) : 0;
        const paymentCount = student.fines ? student.fines.length : 0;

        const row = sheet.addRow([
            index + 1,
            student.prn || '-',
            student.rollNo || '-',
            student.name || '-',
            student.year || '-',
            student.division || '-',
            student.department || '-',
            student.email || '-',
            student.phone || '-',
            totalPayments,
            paymentCount,
        ]);

        row.eachCell((cell) => {
            cell.border = cellBorder;
            cell.alignment = { vertical: 'middle' };
        });

        // Alternate row coloring
        if (index % 2 === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            });
        }
    });

    // Column widths
    sheet.columns = [
        { width: 8 }, { width: 18 }, { width: 12 }, { width: 25 }, { width: 8 },
        { width: 10 }, { width: 20 }, { width: 25 }, { width: 15 },
        { width: 18 }, { width: 15 },
    ];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};

// ============================================
// Generate Students PDF
// ============================================
const generateStudentsPDF = (students) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
        const buffers = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Title
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1A365D')
            .text('INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)', { align: 'center' });
        doc.fontSize(14).fillColor('#2D3748')
            .text('STUDENT RECORDS BACKUP', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#718096')
            .text(`Generated on: ${new Date().toLocaleString('en-IN')}  |  Total Students: ${students.length}`, { align: 'center' });
        doc.moveDown(0.8);

        // Table
        const tableTop = doc.y;
        const colWidths = [35, 80, 45, 130, 40, 40, 100, 100, 80, 80];
        const headers = ['Sr.', 'PRN', 'Roll', 'Name', 'Year', 'Div', 'Department', 'Email', 'Phone', 'Total Paid'];
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        // Draw header
        let x = doc.page.margins.left;
        const headerHeight = 22;

        doc.rect(x, tableTop, pageWidth, headerHeight).fill('#1E40AF');

        headers.forEach((header, i) => {
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF')
                .text(header, x + 3, tableTop + 6, { width: colWidths[i] - 6, align: 'left' });
            x += colWidths[i];
        });

        let y = tableTop + headerHeight;

        // Draw rows
        students.forEach((student, index) => {
            // Check if we need a new page
            if (y + 18 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                y = doc.page.margins.top;

                // Redraw header on new page
                x = doc.page.margins.left;
                doc.rect(x, y, pageWidth, headerHeight).fill('#1E40AF');
                headers.forEach((header, i) => {
                    doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF')
                        .text(header, x + 3, y + 6, { width: colWidths[i] - 6, align: 'left' });
                    x += colWidths[i];
                });
                y += headerHeight;
            }

            const rowHeight = 16;
            const bgColor = index % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
            x = doc.page.margins.left;

            doc.rect(x, y, pageWidth, rowHeight).fill(bgColor);

            const totalPaid = student.fines ? student.fines.reduce((sum, f) => sum + f.amount, 0) : 0;
            const rowData = [
                (index + 1).toString(),
                student.prn || '-',
                student.rollNo || '-',
                student.name || '-',
                student.year || '-',
                student.division || '-',
                student.department || '-',
                student.email || '-',
                student.phone || '-',
                formatCurrency(totalPaid),
            ];

            rowData.forEach((cell, i) => {
                doc.fontSize(7).font('Helvetica').fillColor('#374151')
                    .text(cell, x + 3, y + 4, { width: colWidths[i] - 6, align: 'left', lineBreak: false });
                x += colWidths[i];
            });

            y += rowHeight;
        });

        // Footer
        doc.moveDown(1);
        const footerY = doc.y > doc.page.height - 60 ? doc.page.height - 40 : doc.y + 10;
        doc.fontSize(7).font('Helvetica').fillColor('#718096')
            .text('Zeal Institute of Technology - ITSA Accounts', doc.page.margins.left, footerY);

        doc.end();
    });
};

// ============================================
// Generate Transactions Excel
// ============================================
const generateTransactionsExcel = async (incomeTransactions, expenditures) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ITSA Accounts';
    workbook.created = new Date();

    // ---- Income Sheet ----
    const incomeSheet = workbook.addWorksheet('Income', {
        properties: { defaultColWidth: 18 },
    });

    incomeSheet.mergeCells('A1:K1');
    const incTitle = incomeSheet.getCell('A1');
    incTitle.value = 'INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)';
    incTitle.font = { bold: true, size: 14, color: { argb: 'FF1A365D' } };
    incTitle.alignment = { horizontal: 'center' };

    incomeSheet.mergeCells('A2:K2');
    const incSub = incomeSheet.getCell('A2');
    incSub.value = 'INCOME TRANSACTIONS BACKUP';
    incSub.font = { bold: true, size: 12, color: { argb: 'FF059669' } };
    incSub.alignment = { horizontal: 'center' };

    incomeSheet.mergeCells('A3:K3');
    const incDate = incomeSheet.getCell('A3');
    incDate.value = `Generated on: ${new Date().toLocaleString('en-IN')}`;
    incDate.font = { italic: true, size: 10 };
    incDate.alignment = { horizontal: 'center' };

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    incomeSheet.mergeCells('A4:K4');
    const incTotalCell = incomeSheet.getCell('A4');
    incTotalCell.value = `Total Income: ${formatCurrency(totalIncome)}  |  Transactions: ${incomeTransactions.length}`;
    incTotalCell.font = { bold: true, size: 11, color: { argb: 'FF059669' } };
    incTotalCell.alignment = { horizontal: 'center' };

    incomeSheet.addRow([]);

    const incHeaders = ['Sr.', 'Date', 'Receipt No', 'Roll No', 'PRN', 'Name', 'Class', 'Div', 'Category', 'Description', 'Amount (₹)'];
    const incHeaderRow = incomeSheet.addRow(incHeaders);

    const greenFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    const whiteFont = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    const border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' }
    };

    incHeaderRow.eachCell((cell) => {
        cell.fill = greenFill;
        cell.font = whiteFont;
        cell.border = border;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    incomeTransactions.forEach((t, idx) => {
        const row = incomeSheet.addRow([
            idx + 1,
            formatDate(t.createdAt || t.date),
            t.receiptNumber || '-',
            t.studentRollNo || '-',
            t.studentPRN || '-',
            t.studentName || '-',
            t.studentClass || '-',
            t.studentDivision || '-',
            t.category || '-',
            t.description || '-',
            t.amount || 0,
        ]);
        row.eachCell((cell) => { cell.border = border; });
        if (idx % 2 === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
            });
        }
    });

    // Total row
    incomeSheet.addRow([]);
    const incTotalRow = incomeSheet.addRow([
        '', '', '', '', '', '', '', '', '', 'TOTAL:', totalIncome
    ]);
    incTotalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.border = border;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    });

    incomeSheet.columns = [
        { width: 6 }, { width: 22 }, { width: 14 }, { width: 10 }, { width: 16 },
        { width: 25 }, { width: 8 }, { width: 8 }, { width: 16 }, { width: 30 }, { width: 14 },
    ];

    // ---- Expenditure Sheet ----
    const expSheet = workbook.addWorksheet('Expenditure', {
        properties: { defaultColWidth: 18 },
    });

    expSheet.mergeCells('A1:H1');
    const expTitle = expSheet.getCell('A1');
    expTitle.value = 'INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)';
    expTitle.font = { bold: true, size: 14, color: { argb: 'FF1A365D' } };
    expTitle.alignment = { horizontal: 'center' };

    expSheet.mergeCells('A2:H2');
    const expSub = expSheet.getCell('A2');
    expSub.value = 'EXPENDITURE TRANSACTIONS BACKUP';
    expSub.font = { bold: true, size: 12, color: { argb: 'FFDC2626' } };
    expSub.alignment = { horizontal: 'center' };

    expSheet.mergeCells('A3:H3');
    const expDate = expSheet.getCell('A3');
    expDate.value = `Generated on: ${new Date().toLocaleString('en-IN')}`;
    expDate.font = { italic: true, size: 10 };
    expDate.alignment = { horizontal: 'center' };

    const totalExpenditure = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);
    expSheet.mergeCells('A4:H4');
    const expTotalCell = expSheet.getCell('A4');
    expTotalCell.value = `Total Expenditure: ${formatCurrency(totalExpenditure)}  |  Entries: ${expenditures.length}`;
    expTotalCell.font = { bold: true, size: 11, color: { argb: 'FFDC2626' } };
    expTotalCell.alignment = { horizontal: 'center' };

    expSheet.addRow([]);

    const expHeaders = ['Sr.', 'Date', 'Receipt No', 'Category', 'Description', 'Sender', 'Receiver', 'Amount (₹)'];
    const expHeaderRow = expSheet.addRow(expHeaders);

    const redFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
    expHeaderRow.eachCell((cell) => {
        cell.fill = redFill;
        cell.font = whiteFont;
        cell.border = border;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    expenditures.forEach((e, idx) => {
        const row = expSheet.addRow([
            idx + 1,
            formatDate(e.date || e.createdAt),
            e.receiptNumber || '-',
            e.category || '-',
            e.description || '-',
            e.senderName || '-',
            e.receiverName || '-',
            e.amount || 0,
        ]);
        row.eachCell((cell) => { cell.border = border; });
        if (idx % 2 === 0) {
            row.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
            });
        }
    });

    // Total row
    expSheet.addRow([]);
    const expTotalRow = expSheet.addRow([
        '', '', '', '', '', '', 'TOTAL:', totalExpenditure
    ]);
    expTotalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.border = border;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    });

    expSheet.columns = [
        { width: 6 }, { width: 22 }, { width: 14 }, { width: 16 },
        { width: 30 }, { width: 20 }, { width: 20 }, { width: 14 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
};

// ============================================
// Generate Transactions PDF
// ============================================
const generateTransactionsPDF = (incomeTransactions, expenditures) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
        const buffers = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalExpenditure = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);

        // ---- PAGE 1: Income Transactions ----
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1A365D')
            .text('INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)', { align: 'center' });
        doc.fontSize(14).fillColor('#059669')
            .text('INCOME TRANSACTIONS BACKUP', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#718096')
            .text(`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Income: ${formatCurrency(totalIncome)}  |  Entries: ${incomeTransactions.length}`, { align: 'center' });
        doc.moveDown(0.8);

        // Income table
        const incColWidths = [25, 70, 55, 40, 65, 110, 70, 60, 70, 70];
        const incHeaders = ['Sr.', 'Date', 'Receipt', 'Roll', 'PRN', 'Name', 'Category', 'Class', 'Description', 'Amount'];
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        let x = doc.page.margins.left;
        let y = doc.y;
        const headerHeight = 20;

        doc.rect(x, y, pageWidth, headerHeight).fill('#059669');
        incHeaders.forEach((h, i) => {
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF')
                .text(h, x + 2, y + 5, { width: incColWidths[i] - 4, align: 'left', lineBreak: false });
            x += incColWidths[i];
        });
        y += headerHeight;

        incomeTransactions.forEach((t, idx) => {
            if (y + 15 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                y = doc.page.margins.top;
                x = doc.page.margins.left;
                doc.rect(x, y, pageWidth, headerHeight).fill('#059669');
                incHeaders.forEach((h, i) => {
                    doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF')
                        .text(h, x + 2, y + 5, { width: incColWidths[i] - 4, align: 'left', lineBreak: false });
                    x += incColWidths[i];
                });
                y += headerHeight;
            }

            const rowH = 14;
            const bg = idx % 2 === 0 ? '#F0FDF4' : '#FFFFFF';
            x = doc.page.margins.left;
            doc.rect(x, y, pageWidth, rowH).fill(bg);

            const rowData = [
                (idx + 1).toString(),
                formatDate(t.createdAt || t.date),
                t.receiptNumber || '-',
                t.studentRollNo || '-',
                t.studentPRN || '-',
                t.studentName || '-',
                t.category || '-',
                `${t.studentClass || '-'}/${t.studentDivision || '-'}`,
                (t.description || '-').substring(0, 25),
                formatCurrency(t.amount),
            ];

            rowData.forEach((cell, i) => {
                doc.fontSize(6.5).font('Helvetica').fillColor('#374151')
                    .text(cell, x + 2, y + 3, { width: incColWidths[i] - 4, align: 'left', lineBreak: false });
                x += incColWidths[i];
            });
            y += rowH;
        });

        // ---- PAGE 2: Expenditure Transactions ----
        doc.addPage();
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1A365D')
            .text('INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)', { align: 'center' });
        doc.fontSize(14).fillColor('#DC2626')
            .text('EXPENDITURE TRANSACTIONS BACKUP', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#718096')
            .text(`Generated: ${new Date().toLocaleString('en-IN')}  |  Total Expenditure: ${formatCurrency(totalExpenditure)}  |  Entries: ${expenditures.length}`, { align: 'center' });
        doc.moveDown(0.8);

        const expColWidths = [30, 85, 70, 90, 130, 100, 100, 80];
        const expHeaders = ['Sr.', 'Date', 'Receipt', 'Category', 'Description', 'Sender', 'Receiver', 'Amount'];

        x = doc.page.margins.left;
        y = doc.y;

        doc.rect(x, y, pageWidth, headerHeight).fill('#DC2626');
        expHeaders.forEach((h, i) => {
            doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF')
                .text(h, x + 2, y + 5, { width: expColWidths[i] - 4, align: 'left', lineBreak: false });
            x += expColWidths[i];
        });
        y += headerHeight;

        expenditures.forEach((e, idx) => {
            if (y + 15 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                y = doc.page.margins.top;
                x = doc.page.margins.left;
                doc.rect(x, y, pageWidth, headerHeight).fill('#DC2626');
                expHeaders.forEach((h, i) => {
                    doc.fontSize(7).font('Helvetica-Bold').fillColor('#FFFFFF')
                        .text(h, x + 2, y + 5, { width: expColWidths[i] - 4, align: 'left', lineBreak: false });
                    x += expColWidths[i];
                });
                y += headerHeight;
            }

            const rowH = 14;
            const bg = idx % 2 === 0 ? '#FEF2F2' : '#FFFFFF';
            x = doc.page.margins.left;
            doc.rect(x, y, pageWidth, rowH).fill(bg);

            const rowData = [
                (idx + 1).toString(),
                formatDate(e.date || e.createdAt),
                e.receiptNumber || '-',
                e.category || '-',
                (e.description || '-').substring(0, 40),
                e.senderName || '-',
                e.receiverName || '-',
                formatCurrency(e.amount),
            ];

            rowData.forEach((cell, i) => {
                doc.fontSize(6.5).font('Helvetica').fillColor('#374151')
                    .text(cell, x + 2, y + 3, { width: expColWidths[i] - 4, align: 'left', lineBreak: false });
                x += expColWidths[i];
            });
            y += rowH;
        });

        // Footer
        doc.fontSize(7).font('Helvetica').fillColor('#718096')
            .text('Zeal Institute of Technology - ITSA Accounts', doc.page.margins.left, doc.page.height - 40);

        doc.end();
    });
};

// ============================================
// Fetch all income transactions (from student fines)
// ============================================
const fetchAllIncomeTransactions = async () => {
    const pipeline = [
        { $match: { isActive: true } },
        { $unwind: '$fines' },
        {
            $project: {
                _id: 0,
                studentName: '$name',
                studentPRN: '$prn',
                studentRollNo: '$rollNo',
                studentClass: '$year',
                studentDivision: '$division',
                studentDepartment: '$department',
                type: 'income',
                amount: '$fines.amount',
                category: '$fines.category',
                description: '$fines.reason',
                paymentType: '$fines.type',
                receiptNumber: '$fines.receiptNumber',
                date: '$fines.date',
                createdAt: '$fines.createdAt',
            },
        },
        { $sort: { date: -1 } },
    ];

    return await Student.aggregate(pipeline);
};

// ============================================
// Main Backup Controller
// ============================================




// ============================================
// Download Local Backup (Zip)
// ============================================

/**
 * @desc    Generate backup files and download as ZIP
 * @route   POST /api/backup/download
 * @access  Private
 */
const downloadLocalBackup = asyncHandler(async (req, res) => {
    const { title, academicYear } = req.body;

    if (!title || !academicYear) {
        res.status(400);
        throw new Error('Title and academic year are required');
    }

    console.log(`[BACKUP] Starting local download: "${title}" for academic year ${academicYear}`);

    // Step 1: Fetch all data
    const students = await Student.find({ isActive: true }).sort({ year: 1, division: 1, rollNo: 1 });
    const incomeTransactions = await fetchAllIncomeTransactions();
    const expenditures = await Expenditure.find().sort({ date: -1 }).populate('addedBy', 'name');

    // Step 2: Generate files
    const studentsExcelBuffer = await generateStudentsExcel(students);
    const studentsPDFBuffer = await generateStudentsPDF(students);
    const transactionsExcelBuffer = await generateTransactionsExcel(incomeTransactions, expenditures);
    const transactionsPDFBuffer = await generateTransactionsPDF(incomeTransactions, expenditures);

    // Step 3: Create Zip
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    // Set headers
    const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_${academicYear.replace(/[^a-z0-9]/gi, '_')}.zip`;
    res.attachment(filename);

    // Pipe archive data to the response
    archive.pipe(res);

    // Append files
    archive.append(studentsExcelBuffer, { name: 'Students/Students_Record.xlsx' });
    archive.append(studentsPDFBuffer, { name: 'Students/Students_Record.pdf' });
    archive.append(transactionsExcelBuffer, { name: 'Transactions/Transactions_Record.xlsx' });
    archive.append(transactionsPDFBuffer, { name: 'Transactions/Transactions_Record.pdf' });

    // Finalize the archive (ie we are done appending files but streams have to finish yet)
    await archive.finalize();
});

module.exports = {
    downloadLocalBackup
};
