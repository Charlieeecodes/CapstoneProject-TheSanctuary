const express = require('express');
const router = express.Router();
const { addInquiry, getAllInquiries } = require('../controllers/inquiryController');

// Create a new inquiry
router.post('/', addInquiry);

// Get all inquiries
router.get('/', getAllInquiries);

// For now, leave update/delete routes to be implemented in controllers if needed.
// This keeps the routes file simple and avoids direct db references here.

module.exports = router;
