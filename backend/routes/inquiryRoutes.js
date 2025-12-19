const express = require('express');
const router = express.Router();

const {
  addInquiry,
  getAllInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
  sendMessageController // ✅ import added here
} = require('../controllers/inquiryController');


// ✅ Send message route must come first
router.post('/sendMessage', sendMessageController);

// ✅ Add new inquiry
router.post('/', addInquiry);

// ✅ Get all inquiries
router.get('/', getAllInquiries);

// ✅ Get a single inquiry by ID
router.get('/:id', getInquiryById);

// ✅ Update inquiry status
router.put('/:id', updateInquiryStatus);

// ✅ Delete inquiry
router.delete('/:id', deleteInquiry);

module.exports = router;
