const rateLimit = require('express-rate-limit');
const { asyncHandler } = require('./errorMiddleware');

/**
 * Limit repeated requests to public APIs such as login and password reset
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Limit OTP verification attempts
 */
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 OTP verifications per windowMs
    message: {
        success: false,
        message: 'Too many OTP verification attempts, please try again after 15 minutes'
    }
});

/**
 * Limit password reset requests
 */
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 reset requests per hour
    message: {
        success: false,
        message: 'Too many password reset requests, please try again after an hour'
    }
});

module.exports = {
    loginLimiter,
    otpLimiter,
    forgotPasswordLimiter
};
