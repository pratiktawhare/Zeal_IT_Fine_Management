/**
 * ===========================================
 * Admin Model
 * ===========================================
 * Schema for admin users who manage the system
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Fine subdocument schema (referenced in fines array)
const adminSchema = new mongoose.Schema({
    // Admin email address (unique identifier)
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },

    // Hashed password
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },

    // Admin name (optional)
    name: {
        type: String,
        trim: true,
        default: 'Admin'
    },

    // Account creation timestamp
    createdAt: {
        type: Date,
        default: Date.now
    },

    // Last login timestamp
    lastLogin: {
        type: Date
    },

    // Password Reset OTP fields
    resetOtp: {
        type: String,
        select: false
    },
    resetOtpExpiry: {
        type: Date,
        select: false
    },
    otpVerified: {
        type: Boolean,
        default: false,
        select: false
    }
});

// ===========================================
// Pre-save Middleware - Hash password
// ===========================================
adminSchema.pre('save', async function (next) {
    // Only hash password if it's modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Generate salt with 10 rounds
        const salt = await bcrypt.genSalt(10);
        // Hash the password
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ===========================================
// Instance Methods
// ===========================================

/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword - Plain text password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
adminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Update last login timestamp
 */
adminSchema.methods.updateLastLogin = async function () {
    this.lastLogin = new Date();
    await this.save();
};

// Create and export the model
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
