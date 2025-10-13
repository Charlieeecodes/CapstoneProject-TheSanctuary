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
