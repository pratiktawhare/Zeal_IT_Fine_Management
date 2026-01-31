/**
 * ===========================================
 * Error Handling Middleware
 * ===========================================
 * Centralized error handling for the application
 */

/**
 * Handle 404 - Route Not Found
 * This middleware catches requests to undefined routes
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Global Error Handler
 * Handles all errors passed to next() and uncaught errors
 */
const errorHandler = (err, req, res, next) => {
    // Determine status code
    // If status is 200 (default OK), change to 500 for errors
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
        // Only log stack trace for server errors (500)
        // For client errors (4xx), just log the message to keep terminal clean
        if (statusCode >= 500) {
            console.error('===========================================');
            console.error('Error:', err.message);
            console.error('Stack:', err.stack);
            console.error('===========================================');
        }
    }

    // Handle specific error types
    let message = err.message;

    // Mongoose Bad ObjectId Error
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        message = 'Resource not found. Invalid ID format.';
        res.status(404);
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value entered for ${field}. Please use another value.`;
        res.status(400);
    }

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        message = errors.join('. ');
        res.status(400);
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please log in again.';
        res.status(401);
    }

    if (err.name === 'TokenExpiredError') {
        message = 'Your session has expired. Please log in again.';
        res.status(401);
    }

    // Send error response
    res.status(statusCode !== 200 ? statusCode : 500).json({
        success: false,
        message: message,
        // Include stack trace only in development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to error middleware
 * This eliminates the need for try-catch blocks in every route handler
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Express middleware function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    notFound,
    errorHandler,
    asyncHandler
};
