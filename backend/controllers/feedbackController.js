const db = require('../models/db'); // make sure this is mysql2/promise

const addFeedback = async (req, res) => {
  // 1️⃣ Log incoming data for debugging
  console.log('📩 Feedback received:', req.body);

  let {
    name,
    email,
    message,
    overall_rating = 0,
    service_rating = 0,
    satisfaction_rating = 0,
    professionalism_rating = 0,
    communication_rating = 0,
    facility_rating = 0,
    userId = null
  } = req.body;

  // 2️⃣ Clamp ratings to 0-5 and ensure numbers
  overall_rating = Math.min(Math.max(Number(overall_rating) || 0, 0), 5);
  service_rating = Math.min(Math.max(Number(service_rating) || 0, 0), 5);
  satisfaction_rating = Math.min(Math.max(Number(satisfaction_rating) || 0, 0), 5);
  professionalism_rating = Math.min(Math.max(Number(professionalism_rating) || 0, 0), 5);
  communication_rating = Math.min(Math.max(Number(communication_rating) || 0, 0), 5);
  facility_rating = Math.min(Math.max(Number(facility_rating) || 0, 0), 5);

  // 3️⃣ Validate required fields
  if (!message) {
    console.warn('⚠️ Feedback message missing');
    return res.status(400).json({ success: false, message: 'Feedback message is required.' });
  }

  if (!userId && (!name || !email)) {
    console.warn('⚠️ Guest submission missing name/email');
    return res.status(400).json({ success: false, message: 'Name and email are required for guest feedback.' });
  }

  // 4️⃣ Prepare SQL safely
  const sql = `
    INSERT INTO feedbacks
    (name, email, message, overall_rating, service_rating, satisfaction_rating, professionalism_rating, communication_rating, facility_rating, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    name, email, message,
    overall_rating, service_rating, satisfaction_rating,
    professionalism_rating, communication_rating, facility_rating,
    userId
  ];

  console.log('🔹 Executing SQL:', sql);
  console.log('🔹 With values:', values);

  // 5️⃣ Try inserting feedback
  try {
    const [result] = await db.query(sql, values);
    console.log('✅ Feedback inserted:', result);

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully!',
      id: result.insertId
    });
  } catch (err) {
    console.error('❌ Error inserting feedback into DB:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback. Check server logs.'
    });
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
  const {
    overall_rating,
    service_rating,
    satisfaction_rating,
    professionalism_rating,
    communication_rating,
    facility_rating
  } = req.body;

  try {
    await db.query(
      `UPDATE feedbacks SET 
        overall_rating=?, 
        service_rating=?, 
        satisfaction_rating=?, 
        professionalism_rating=?, 
        communication_rating=?, 
        facility_rating=? 
      WHERE id=?`,
      [overall_rating, service_rating, satisfaction_rating, professionalism_rating, communication_rating, facility_rating, id]
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
  updateFeedbackRatings
};
