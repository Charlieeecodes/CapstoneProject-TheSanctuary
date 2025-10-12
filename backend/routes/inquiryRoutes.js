const express = require('express');
const router = express.Router();
const { addInquiry, getAllInquiries } = require('../controllers/inquiryController');

router.post('/', addInquiry);
router.get('/', getAllInquiries);
// Get all inquiries
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM inquiries ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ error: 'Database error' });
  }
});
// Update inquiry status
router.put('/:id', async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    await db.promise().query('UPDATE inquiries SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating inquiry:', err);
    res.status(500).json({ success: false });
  }
});

// Delete inquiry
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().query('DELETE FROM inquiries WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting inquiry:', err);
    res.status(500).json({ success: false });
  }
});


module.exports = router;
