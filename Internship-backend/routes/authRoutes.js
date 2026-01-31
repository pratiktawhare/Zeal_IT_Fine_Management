/**
 * ===========================================
 * Authentication Routes
 * ===========================================
 * Routes for admin authentication
 */

const express = require('express');
const router = express.Router();
const {
    checkSetupStatus,
    loginAdmin,
    getProfile,
    registerAdmin,
    changePassword,
    updateProfile,
    forgotPassword,
    verifyOtp,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, otpLimiter, forgotPasswordLimiter } = require('../middleware/rateLimitMiddleware');

/**
 * @route   GET /api/auth/setup-status
 * @desc    Check if first-time setup is required
 * @access  Public
 */
router.get('/setup-status', checkSetupStatus);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin and get token
 * @access  Public
 * 
 * Request Body:
 * {
 *   "email": "admin@college.edu",
 *   "password": "your_password"
 * }
 */
router.post('/login', loginLimiter, loginAdmin);

/**
 * @route   POST /api/auth/register
 * @desc    Register first admin (only works when no admin exists)
 * @access  Public (disabled after first admin created)
 * 
 * Request Body:
 * {
 *   "password": "your_password",
 *   "name": "Admin Name" (optional)
 * }
 */
router.post('/register', registerAdmin);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset OTP (sent to EMAIL_USER)
 * @access  Public
 */
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 * 
 * Request Body:
 * {
 *   "otp": "123456"
 * }
 */
router.post('/verify-otp', otpLimiter, verifyOtp);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password after OTP verification
 * @access  Public
 * 
 * Request Body:
 * {
 *   "newPassword": "new_password"
 * }
 */
router.post('/reset-password', resetPassword);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current admin profile
 * @access  Private (requires JWT token)
 * 
 * Headers:
 * Authorization: Bearer <token>
 */
router.get('/profile', protect, getProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change admin password
 * @access  Private
 * 
 * Request Body:
 * {
 *   "currentPassword": "old_password",
 *   "newPassword": "new_password"
 * }
 */
router.put('/change-password', protect, changePassword);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update admin profile (name only)
 * @access  Private
 * 
 * Request Body:
 * {
 *   "name": "New Name"
 * }
 */
router.put('/update-profile', protect, updateProfile);

module.exports = router;

