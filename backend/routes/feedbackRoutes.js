const express = require('express');
const router = express.Router();
const {
  addFeedback,
  getAllFeedbacks,
  deleteFeedback,
  updateFeedbackRatings
} = require('../controllers/feedbackController');

// ✅ Routes
router.post('/', addFeedback);   
router.get('/', getAllFeedbacks);    
router.delete('/:id', deleteFeedback); 
router.put('/:id', updateFeedbackRatings); // new route

module.exports = router;
