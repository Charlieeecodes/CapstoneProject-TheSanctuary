const db = require('../models/db');

exports.addInquiry = (req, res) => {
  const { name, email, subject, message } = req.body;
  const sql = "INSERT INTO inquiries (name, email, subject, message, status) VALUES (?, ?, ?, ?, 'Pending')";
  db.query(sql, [name, email, subject, message], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true, message: 'Inquiry submitted successfully!' });
  });
};

exports.getAllInquiries = (req, res) => {
  const sql = "SELECT * FROM inquiries ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

exports.updateInquiryStatus = (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const sql = 'UPDATE inquiries SET status = ? WHERE id = ?';
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating inquiry:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
};

exports.deleteInquiry = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM inquiries WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting inquiry:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
};
