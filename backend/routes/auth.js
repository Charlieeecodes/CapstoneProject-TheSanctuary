// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const nodemailer = require('nodemailer');
require('dotenv').config();

const router = express.Router();

// -----------------------------
// Email sender setup
// -----------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: `"The Sanctuary" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${code}`
  };
  await transporter.sendMail(mailOptions);
};

// -----------------------------
// Register
// -----------------------------
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      const user = existing[0];

      if (!user.isVerified) {
        // Re-send verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query('UPDATE users SET verificationCode = ? WHERE id = ?', [verificationCode, user.id]);
        await sendVerificationEmail(email, verificationCode);

        return res.json({
          success: true,
          message: '⚠️ This email is not verified yet. A new verification code has been sent.'
        });
      }

      return res.status(400).json({ success: false, message: '⚠️ Email already registered' });
    }

    // Hash password and insert new user
    // Hash password and insert new user
    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, verificationCode, isVerified) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, verificationCode, false]
    );

    // ✅ In development, log code instead of sending real email
    if (process.env.NODE_ENV === 'development') {
      console.log(`📨 [DEV MODE] Verification code for ${email}: ${verificationCode}`);
    } else {
      await sendVerificationEmail(email, verificationCode);
    }

    res.json({
      success: true,
      message: 'Registration successful! Please check your email (or console in dev mode).'
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});


// -----------------------------
// Verify email
// -----------------------------
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No account found.' });
    }

    const user = rows[0];
    if (user.isVerified) {
      return res.json({ success: true, message: 'Email already verified.' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Incorrect verification code.' });
    }

    await db.query('UPDATE users SET isVerified = ?, verificationCode = NULL WHERE id = ?', [true, user.id]);
    res.json({ success: true, message: 'Email verified successfully!' });

  } catch (err) {
    console.error('❌ Verification error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// -----------------------------
// Login
// -----------------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: '⚠️ No account found with this email.' });
    }

    const user = rows[0];

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: '⚠️ Please verify your email before logging in.' });
    }

    if (!user.password) {
      return res.status(500).json({ success: false, message: 'User record missing password hash' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: '⚠️ Incorrect password. Please try again.' });
    }

    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined');
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Login success:', { token, user });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed due to server error' });
  }
});
router.post('/resend', async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No account found with this email.' });
    }

    const user = rows[0];
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await db.query('UPDATE users SET verificationCode = ? WHERE id = ?', [verificationCode, user.id]);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📨 [DEV MODE] Resent verification code for ${email}: ${verificationCode}`);
    } else {
      await sendVerificationEmail(email, verificationCode);
    }

    res.json({
      success: true,
      message: 'A new verification code has been sent (or logged in dev mode).'
    });

  } catch (err) {
    console.error('❌ Resend verification error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


module.exports = router;
