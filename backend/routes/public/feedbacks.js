// backend/routes/public/feedbacks.js
const express = require('express');
const router = express.Router();
const { addFeedback } = require('../../controllers/feedbackController');

// POST /api/public/feedbacks
// This route handles client feedback submissions
router.post('/', addFeedback);

module.exports = router;
