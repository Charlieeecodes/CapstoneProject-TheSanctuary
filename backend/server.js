// server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// ----------------------
// Middleware
// ----------------------
const corsOptions = {
  origin: '*', // or your frontend URL if you want stricter security
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// Optional: COEP headers (fix NotSameOriginAfterDefaultedToSameOriginByCoep)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});


// ----------------------
// Serve all frontend files (HTML, JS, CSS, images)
// ----------------------
app.use(express.static(path.join(__dirname, '../docs')));

// ----------------------
// Pretty URL for /inquiry (optional)
// ----------------------
app.get('/inquiry', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs/inquiry.html'));
});

// ----------------------
// API Routes
// ----------------------
const inquiryRoutes = require('./routes/inquiryRoutes');
const recordRoutes = require('./routes/records');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const publicInquiriesRoute = require('./routes/public/inquiries');
const publicFeedbacksRoute = require('./routes/public/feedbacks');
const authRoutes = require('./routes/auth'); // <-- new auth router


app.use('/api/inquiries', inquiryRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/public/inquiries', publicInquiriesRoute);
app.use('/api/public/feedbacks', publicFeedbacksRoute);
app.use('/api/auth', authRoutes); // <-- login/register API

// ----------------------
console.log('✅ Routes mounted successfully');
console.log(path.join(__dirname, '../docs'));

// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
