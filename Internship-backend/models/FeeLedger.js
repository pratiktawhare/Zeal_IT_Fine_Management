/**
 * ===========================================
 * FeeLedger Model
 * ===========================================
 * Tracks expected fees per student per category
 * with payment history and auto-calculated status
 */

const mongoose = require('mongoose');

// ===========================================
// Payment Subdocument Schema
// ===========================================
const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: [true, 'Payment amount is required'],
        min: [0, 'Payment amount cannot be negative']
    },
    date: {
        type: Date,
        default: Date.now
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'upi', 'card', 'bank', 'other'],
        default: 'cash'
    },
    receiptNumber: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true,
        maxlength: [500, 'Remarks cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// ===========================================
// Fee Ledger Schema
// ===========================================
const feeLedgerSchema = new mongoose.Schema({
    // Reference to student
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'Student reference is required']
    },

    // Reference to payment category
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentCategory',
        required: [true, 'Category reference is required']
    },

    // Denormalized student info for faster queries
    studentPRN: {
        type: String,
        required: true,
        uppercase: true,
        index: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentRollNo: {
        type: String,
        index: true
    },
    studentClass: {
        type: String,
        index: true
    },
    studentDivision: {
        type: String,
        index: true
    },

    // Category info (denormalized)
    categoryName: {
        type: String,
        required: true
    },

    // Fee amounts
    totalAmount: {
        type: Number,
        required: [true, 'Total fee amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    paidAmount: {
        type: Number,
        default: 0,
        min: [0, 'Paid amount cannot be negative']
    },

    // Status: auto-calculated based on payments
    status: {
        type: String,
        enum: ['unpaid', 'partial', 'paid'],
        default: 'unpaid',
        index: true
    },

    // Payment history
    payments: [paymentSchema],

    // Academic year for filtering
    academicYear: {
        type: String,
        trim: true
    },

    // Due date (optional)
    dueDate: {
        type: Date
    },

    // Whether this ledger entry is active
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// ===========================================
// Virtual Fields
// ===========================================

/**
 * Calculate remaining amount
 */
feeLedgerSchema.virtual('remainingAmount').get(function () {
    return Math.max(0, this.totalAmount - this.paidAmount);
});

// Ensure virtuals are included in JSON output
feeLedgerSchema.set('toJSON', { virtuals: true });
feeLedgerSchema.set('toObject', { virtuals: true });

// ===========================================
// Pre-save Middleware
// ===========================================

/**
 * Auto-calculate paid amount and status before saving
 */
feeLedgerSchema.pre('save', function (next) {
    // Calculate total paid from payments array
    if (this.payments && this.payments.length > 0) {
        this.paidAmount = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    }

    // Auto-update status based on payment
    if (this.paidAmount <= 0) {
        this.status = 'unpaid';
    } else if (this.paidAmount >= this.totalAmount) {
        this.status = 'paid';
    } else {
        this.status = 'partial';
    }

    next();
});

// ===========================================
// Indexes
// ===========================================

// Compound index for efficient queries
feeLedgerSchema.index({ student: 1, category: 1 }, { unique: true });
feeLedgerSchema.index({ studentClass: 1, status: 1 });
feeLedgerSchema.index({ category: 1, status: 1 });

// ===========================================
// Static Methods
// ===========================================

/**
 * Get class-wise summary
 */
feeLedgerSchema.statics.getClassSummary = async function (filters = {}) {
    const matchConditions = { isActive: true };

    if (filters.category) matchConditions.category = filters.category;
    if (filters.academicYear) matchConditions.academicYear = filters.academicYear;

    const summary = await this.aggregate([
        { $match: matchConditions },
        {
            $group: {
                _id: '$studentClass',
                totalStudents: { $sum: 1 },
                fullyPaid: {
                    $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
                },
                partiallyPaid: {
                    $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] }
                },
                unpaid: {
                    $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] }
                },
                totalExpected: { $sum: '$totalAmount' },
                totalCollected: { $sum: '$paidAmount' },
                totalPending: {
                    $sum: { $subtract: ['$totalAmount', '$paidAmount'] }
                }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    return summary;
};

// Create and export the model
const FeeLedger = mongoose.model('FeeLedger', feeLedgerSchema);

module.exports = FeeLedger;
