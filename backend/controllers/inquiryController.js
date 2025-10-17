const db = require('../models/db'); // your promise-based database connection
const nodemailer = require('nodemailer');

// ✅ Add a new inquiry
exports.addInquiry = async (req, res) => {
  const { name, email, subject, message } = req.body;
  const sql = "INSERT INTO inquiries (name, email, subject, message, status) VALUES (?, ?, ?, ?, 'Pending')";
  
  try {
    const [result] = await db.query(sql, [name, email, subject, message]);
    res.json({ success: true, message: 'Inquiry submitted successfully!', id: result.insertId });
  } catch (err) {
    console.error('Error adding inquiry:', err);
    res.status(500).json({ success: false, message: 'Error adding inquiry' });
  }
};

// ✅ Get all inquiries
exports.getAllInquiries = async (req, res) => {
  const sql = "SELECT * FROM inquiries ORDER BY created_at DESC";
  
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    res.status(500).json({ success: false, message: 'Error fetching inquiries' });
  }
};

// ✅ Get single inquiry by ID
exports.getInquiryById = async (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM inquiries WHERE id = ?";
  
  try {
    const [results] = await db.query(sql, [id]);
    if (results.length === 0) return res.status(404).json({ message: 'Inquiry not found' });
    res.json(results[0]);
  } catch (err) {
    console.error('Error fetching inquiry:', err);
    res.status(500).json({ success: false, message: 'Error fetching inquiry' });
  }
};

// ✅ Update inquiry status
exports.updateInquiryStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = "UPDATE inquiries SET status = ? WHERE id = ?";
  
  try {
    const [result] = await db.query(sql, [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry status updated successfully' });
  } catch (err) {
    console.error('Error updating inquiry:', err);
    res.status(500).json({ success: false, message: 'Error updating inquiry' });
  }
};

// ✅ Delete inquiry
exports.deleteInquiry = async (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM inquiries WHERE id = ?";
  
  try {
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Inquiry not found' });
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (err) {
    console.error('Error deleting inquiry:', err);
    res.status(500).json({ success: false, message: 'Error deleting inquiry' });
  }
};

// ✅ Send message (via Gmail SMTP)
exports.sendMessageController = async (req, res) => {
  const { to, message, inquiryId } = req.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, message: 'Recipient and message are required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,   // e.g., smtp.gmail.com
      port: 587,                     // TLS port
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

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
