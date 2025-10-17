const db = require('../models/db'); // your database connection

// Add feedback
const addFeedback = async (req, res) => {
  let { name, email, message, overall_rating = 0, service_rating = 0, satisfaction_rating = 0, response_rating = 0 } = req.body;

  // Ensure ratings are numeric
  overall_rating = Math.min(Math.max(Number(overall_rating) || 0, 0), 5);
  service_rating = Math.min(Math.max(Number(service_rating) || 0, 0), 5);
  satisfaction_rating = Math.min(Math.max(Number(satisfaction_rating) || 0, 0), 5);
  response_rating = Math.min(Math.max(Number(response_rating) || 0, 0), 5);


  try {
    const [result] = await db.query(
      'INSERT INTO feedbacks (name, email, message, overall_rating, service_rating, satisfaction_rating, response_rating) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, message, overall_rating, service_rating, satisfaction_rating, response_rating]
    );
    res.status(201).json({ message: 'Feedback added', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Get all feedbacks
const getAllFeedbacks = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM feedbacks ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete feedback
const deleteFeedback = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM feedbacks WHERE id=?', [id]);
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update feedback ratings (new)
const updateFeedbackRatings = async (req, res) => {
  const { id } = req.params;
  const { overall_rating, service_rating, satisfaction_rating, response_rating } = req.body;
  try {
    await db.query(
      'UPDATE feedbacks SET overall_rating=?, service_rating=?, satisfaction_rating=?, response_rating=? WHERE id=?',
      [overall_rating, service_rating, satisfaction_rating, response_rating, id]
    );
    res.json({ message: 'Feedback ratings updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addFeedback,
  getAllFeedbacks,
  deleteFeedback,
  updateFeedbackRatings // export new function
};
