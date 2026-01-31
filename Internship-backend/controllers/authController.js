/**
 * ===========================================
 * Authentication Controller
 * ===========================================
 * Handles admin authentication operations
 */

const Admin = require('../models/Admin');
const { generateToken } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorMiddleware');
const nodemailer = require('nodemailer');

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email to admin
 */
const sendOTPEmail = async (email, otp) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration not found');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: `"ITSA Accounts" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Password Reset OTP - ITSA Accounts',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
                <tr>
                    <td style="padding: 40px 20px;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto;">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 36px 32px; border-radius: 16px 16px 0 0; text-align: center;">
                                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; line-height: 56px;">
                                        <span style="font-size: 28px; color: white;">🔐</span>
                                    </div>
                                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Password Reset</h1>
                                    <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">ITSA Accounts</p>
                                </td>
                            </tr>
                            
                            <!-- Body -->
                            <tr>
                                <td style="background-color: #ffffff; padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 1.6;">
                                        You have requested to reset your password. Use the OTP below to proceed:
                                    </p>
                                    
                                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 28px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px;">Your OTP Code</p>
                                        <p style="margin: 0; font-size: 36px; color: #1e40af; font-weight: 700; letter-spacing: 8px;">${otp}</p>
                                    </div>
                                    
                                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
                                        ⏱️ This OTP is valid for <strong>10 minutes</strong>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #1f2937; padding: 24px 32px; border-radius: 0 0 16px 16px; text-align: center;">
                                    <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px;">
                                        If you didn't request this, please ignore this email.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `
    };

    await transporter.sendMail(mailOptions);
};

/**
 * Get masked email for display
 */
const getMaskedEmail = (email) => {
    if (!email) return '***@***.***';
    const [user, domain] = email.split('@');
    const maskedUser = user.slice(0, 2) + '***' + user.slice(-1);
    return `${maskedUser}@${domain}`;
};

/**
 * @desc    Check if first-time setup is required
 * @route   GET /api/auth/setup-status
 * @access  Public
 */
const checkSetupStatus = asyncHandler(async (req, res) => {
    const adminCount = await Admin.countDocuments();

    res.status(200).json({
        success: true,
        data: {
            setupRequired: adminCount === 0,
            adminEmail: getMaskedEmail(process.env.EMAIL_USER)
        }
    });
});

/**
 * @desc    Login admin
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // Find admin by email and include password field
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    // Check if admin exists
    if (!admin) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Compare passwords
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Update last login timestamp
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = generateToken(admin._id);

    // Send response
    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            lastLogin: admin.lastLogin,
            token: token
        }
    });
});

/**
 * @desc    Get current admin profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
    // Admin is attached to request by auth middleware
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    res.status(200).json({
        success: true,
        data: {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            createdAt: admin.createdAt,
            lastLogin: admin.lastLogin
        }
    });
});

/**
 * @desc    Register first admin (only works when no admin exists)
 * @route   POST /api/auth/register
 * @access  Public (disabled after first admin created)
 */
const registerAdmin = asyncHandler(async (req, res) => {
    const { password, name } = req.body;

    // Check if any admin already exists
    const existingAdmin = await Admin.countDocuments();
    if (existingAdmin > 0) {
        res.status(403);
        throw new Error('System is already configured. Registration is disabled.');
    }

    // Use EMAIL_USER from .env as admin email
    const email = process.env.EMAIL_USER;
    if (!email) {
        res.status(500);
        throw new Error('EMAIL_USER not configured in environment');
    }

    // Validate password
    if (!password) {
        res.status(400);
        throw new Error('Please provide a password');
    }

    if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    // Create new admin
    const admin = await Admin.create({
        email: email.toLowerCase(),
        password: password,
        name: name || 'System Admin'
    });

    // Generate token
    const token = generateToken(admin._id);

    res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            token: token
        }
    });
});

/**
 * @desc    Change admin password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Validate request
    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide current password and new password');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('New password must be at least 6 characters');
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin.id).select('+password');

    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
        res.status(400); // Changed from 401 to prevent frontend from redirecting to login
        throw new Error('Current password is incorrect');
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Generate new token
    const token = generateToken(admin._id);

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
        data: {
            token: token
        }
    });
});

/**
 * @desc    Update admin profile (name only, email is fixed)
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    if (name) {
        admin.name = name;
    }

    await admin.save();

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            id: admin._id,
            email: admin.email,
            name: admin.name
        }
    });
});

/**
 * @desc    Request password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
    // Get admin (there's only one)
    const admin = await Admin.findOne().select('+resetOtp +resetOtpExpiry');

    if (!admin) {
        res.status(404);
        throw new Error('No admin account exists');
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to admin
    admin.resetOtp = otp;
    admin.resetOtpExpiry = otpExpiry;
    admin.otpVerified = false;
    await admin.save();

    // Send OTP email
    try {
        await sendOTPEmail(admin.email, otp);
    } catch (error) {
        admin.resetOtp = undefined;
        admin.resetOtpExpiry = undefined;
        await admin.save();
        res.status(500);
        throw new Error('Failed to send OTP email. Please try again.');
    }

    res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
            email: getMaskedEmail(admin.email)
        }
    });
});

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    if (!otp) {
        res.status(400);
        throw new Error('Please provide OTP');
    }

    const admin = await Admin.findOne().select('+resetOtp +resetOtpExpiry +otpVerified');

    if (!admin) {
        res.status(404);
        throw new Error('No admin account exists');
    }

    // Check if OTP exists
    if (!admin.resetOtp || !admin.resetOtpExpiry) {
        res.status(400);
        throw new Error('No OTP request found. Please request a new OTP.');
    }

    // Check if OTP expired
    if (new Date() > admin.resetOtpExpiry) {
        admin.resetOtp = undefined;
        admin.resetOtpExpiry = undefined;
        admin.otpVerified = false;
        await admin.save();
        res.status(400);
        throw new Error('OTP has expired. Please request a new one.');
    }

    // Check if OTP matches
    if (admin.resetOtp !== otp) {
        res.status(400);
        throw new Error('Invalid OTP');
    }

    // Mark as verified
    admin.otpVerified = true;
    await admin.save();

    res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
    });
});

/**
 * @desc    Reset password after OTP verification
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword } = req.body;

    if (!newPassword) {
        res.status(400);
        throw new Error('Please provide new password');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    const admin = await Admin.findOne().select('+resetOtp +resetOtpExpiry +otpVerified +password');

    if (!admin) {
        res.status(404);
        throw new Error('No admin account exists');
    }

    // Check if OTP was verified
    if (!admin.otpVerified) {
        res.status(400);
        throw new Error('Please verify OTP first');
    }

    // Update password
    admin.password = newPassword;
    admin.resetOtp = undefined;
    admin.resetOtpExpiry = undefined;
    admin.otpVerified = false;
    await admin.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successfully'
    });
});

module.exports = {
    checkSetupStatus,
    loginAdmin,
    getProfile,
    registerAdmin,
    changePassword,
    updateProfile,
    forgotPassword,
    verifyOtp,
    resetPassword
};

