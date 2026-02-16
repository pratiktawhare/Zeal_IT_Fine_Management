/**
 * ===========================================
 * Backup Routes
 * ===========================================
 * Routes for data backup operations
 */

const express = require('express');
const router = express.Router();
const { downloadLocalBackup } = require('../controllers/backupController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/backup/download
 * @desc    Download backup as ZIP
 * @access  Private (requires authentication)
 */
router.post('/download', protect, downloadLocalBackup);

module.exports = router;
