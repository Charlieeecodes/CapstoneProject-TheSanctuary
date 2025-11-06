const express = require('express');
const db = require('../../models/db'); // ✅ correct path
const fetch = require('node-fetch'); // for reCAPTCHA verification
const verifyJWT = require('../../middleware/verifyJWT');
require('dotenv').config();

const router = express.Router();
console.log('📬 Public inquiry route loaded');

router.post('/', verifyJWT, async (req, res) => {
  try {
    const user = req.user; // JWT decoded user (if logged in)
    const { name, email, subject, message, recaptchaToken } = req.body;

    const submitterName = user ? user.name : name;
    const submitterEmail = user ? user.email : email;
    // 1️⃣ Validate required fields
    if (!subject || !message || (!name && !email)) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.',
      });
    }

    // 2️⃣ Verify reCAPTCHA
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: 'Please complete the reCAPTCHA.',
      });
    }

    try {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;

      const response = await fetch(verificationUrl, { method: 'POST' });
      const data = await response.json();

      if (!data.success) {
        return res.status(400).json({
          success: false,
          message: 'CAPTCHA verification failed. Please try again.',
        });
      }
    } catch (err) {
      console.error('❌ reCAPTCHA verification error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error during CAPTCHA verification.',
      });
    }

    // 3️⃣ Insert inquiry into DB
    const sql = `
      INSERT INTO inquiries (name, email, subject, message, status)
      VALUES (?, ?, ?, ?, 'Pending')
    `;
    const [result] = await db.execute(sql, [
      name || null,
      email || null,
      subject,
      message,
    ]);

    console.log(`✅ New inquiry saved (ID: ${result.insertId})`);

    res.status(200).json({
      success: true,
      message: 'Inquiry submitted successfully!',
    });

  } catch (error) {
    console.error('🚨 Server error in /api/public/inquiries:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting inquiry.',
    });
  }
});

router.get('/test', (req, res) => {
  res.json({ message: '✅ Public inquiry route is working' });
});

module.exports = router;
