const express = require('express');
const router = express.Router();
const db = require('../models/db');

// KPI endpoint
router.get('/kpis', async (req, res) => {
  try {
    const [totalInquiriesResult] = await db.query('SELECT COUNT(*) AS total FROM inquiries');
    const totalInquiries = totalInquiriesResult[0].total;

    const [totalFeedbacksResult] = await db.query('SELECT COUNT(*) AS total FROM feedbacks');
    const totalFeedbacks = totalFeedbacksResult[0].total;

    const [topServiceResult] = await db.query(`
      SELECT service, COUNT(*) AS count 
      FROM records 
      GROUP BY service 
      ORDER BY count DESC 
      LIMIT 1
    `);
    const topService = topServiceResult[0]?.service || 'N/A';
    const topServiceCount = topServiceResult[0]?.count || 0;

    // Optional: growth calculation
    const lastMonthCount = parseInt(req.query.lastMonth) || 0;
    const growth = lastMonthCount ? (((totalInquiries - lastMonthCount) / lastMonthCount) * 100).toFixed(1) : 0;

    res.json({ totalInquiries, totalFeedbacks, topService, topServiceCount, growth });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
