const db = require('../models/db');
const nodemailer = require('nodemailer'); // ✅ only declared once

// ✅ Add a new inquiry
exports.addInquiry = (req, res) => {
  const { name, email, subject, message } = req.body;
  const sql = "INSERT INTO inquiries (name, email, subject, message, status) VALUES (?, ?, ?, ?, 'Pending')";
  db.query(sql, [name, email, subject, message], (err, result) => {
    if (err) {
      console.error('Error adding inquiry:', err);
      return res.status(500).send({ success: false, message: 'Error adding inquiry' });
    }
    res.json({ success: true, message: 'Inquiry submitted successfully!', id: result.insertId });
  });
};

// ✅ Get all inquiries
exports.getAllInquiries = (req, res) => {
  const sql = "SELECT * FROM inquiries ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching inquiries:', err);
      return res.status(500).send({ success: false, message: 'Error fetching inquiries' });
    }
    res.json(results);
  });
};

// ✅ Get single inquiry by ID
exports.getInquiryById = (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM inquiries WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching inquiry:', err);
      return res.status(500).send({ success: false, message: 'Error fetching inquiry' });
    }
    if (results.length === 0) return res.status(404).json({ message: 'Inquiry not found' });
    res.json(results[0]);
  });
};

// ✅ Update inquiry status
exports.updateInquiryStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = "UPDATE inquiries SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating inquiry:', err);
      return res.status(500).send({ success: false, message: 'Error updating inquiry' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry status updated successfully' });
  });
};

// ✅ Delete inquiry
exports.deleteInquiry = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM inquiries WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting inquiry:', err);
      return res.status(500).send({ success: false, message: 'Error deleting inquiry' });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  });
};

// ✅ Send message (real email via Gmail SMTP)
exports.sendMessageController = async (req, res) => {
  const { to, message, inquiryId } = req.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, message: 'Recipient and message are required' });
  }

  try {
    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,      // e.g., smtp.gmail.com
      port: 587,                        // TLS port
      secure: false,                    // true for port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Send email
    await transporter.sendMail({
      from: `"The Sanctuary Management" <${process.env.SMTP_USER}>`,
      to,
      subject: `Response to your inquiry #${inquiryId}`,
      text: message
    });

    res.json({ success: true, message: 'Email sent successfully.' });

  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
};
