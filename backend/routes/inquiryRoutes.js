const express = require('express');
const router = express.Router();
const { addInquiry, getAllInquiries } = require('../controllers/inquiryController');

router.post('/', addInquiry);
router.get('/', getAllInquiries);

module.exports = router;
