const express = require('express');
const router = express.Router();
const db = require('../models/db');

/* ========================================
   📊 ANALYTICS CONTROLLER
======================================== */

/**
 * 🟣 GET /api/analytics/kpis
 * Returns key performance indicators for dashboard
 */
router.get('/kpis', async (req, res) => {
  try {
    // 1️⃣ Total Inquiries
    const [inqRows] = await db.query('SELECT COUNT(*) AS totalInquiries FROM inquiries');

    // 2️⃣ Total Feedbacks
    const [fbRows] = await db.query('SELECT COUNT(*) AS totalFeedbacks FROM feedbacks');

    // 3️⃣ Average Ratings
    const [ratingRows] = await db.query(`
      SELECT 
        AVG(overall_rating) AS avgOverall,
        AVG(service_rating) AS avgService,
        AVG(satisfaction_rating) AS avgSatisfaction,
        AVG(response_rating) AS avgResponse
      FROM feedbacks
    `);

    // 4️⃣ Growth (month-over-month inquiries)
    const [currentMonth] = await db.query(`
      SELECT COUNT(*) AS count
      FROM inquiries
      WHERE MONTH(created_at) = MONTH(CURDATE())
        AND YEAR(created_at) = YEAR(CURDATE())
    `);
    const [lastMonth] = await db.query(`
      SELECT COUNT(*) AS count
      FROM inquiries
      WHERE MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)
        AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)
    `);

    const growth = lastMonth[0].count
      ? (((currentMonth[0].count - lastMonth[0].count) / lastMonth[0].count) * 100).toFixed(1)
      : 0;

    // ✅ Send data to frontend
    res.json({
      totalInquiries: inqRows[0].totalInquiries,
      totalFeedbacks: fbRows[0].totalFeedbacks,
      avgRatings: {
        overall: parseFloat(ratingRows[0].avgOverall || 0).toFixed(2),
        service: parseFloat(ratingRows[0].avgService || 0).toFixed(2),
        satisfaction: parseFloat(ratingRows[0].avgSatisfaction || 0).toFixed(2),
        response: parseFloat(ratingRows[0].avgResponse || 0).toFixed(2)
      },
      growth: parseFloat(growth)
    });
  } catch (err) {
    console.error('❌ Error fetching KPIs:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

/**
 * 🟣 GET /api/analytics/inquiries
 * Returns inquiry analytics by selected period (week, month, year)
 */
router.get('/inquiries', async (req, res) => {
  const { period = 'month', mode = 'summary' } = req.query;

  try {
    if (mode === 'summary') {
      // ✅ Total inquiries for selected period
      let sql = 'SELECT COUNT(*) AS total FROM inquiries';

      if (period === 'week') {
        sql += ' WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
      } else if (period === 'month') {
        sql += ' WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
      } else if (period === 'year') {
        sql += ' WHERE YEAR(created_at) = YEAR(CURDATE())';
      }

      const [rows] = await db.query(sql);
      return res.json({ total: rows[0].total });
    }

    // 📈 Trend Mode
    let trendQuery = '';
    if (period === 'week') {
      trendQuery = `
        SELECT DAYNAME(created_at) AS label, COUNT(*) AS count
        FROM inquiries
        WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
        GROUP BY DAYOFWEEK(created_at)
        ORDER BY DAYOFWEEK(created_at);
      `;
    } else if (period === 'month') {
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%e %b') AS label, COUNT(*) AS count
        FROM inquiries
        WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
        GROUP BY DAY(created_at)
        ORDER BY DAY(created_at);
      `;
    } else if (period === 'year') {
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%b %Y') AS label, COUNT(*) AS count
        FROM inquiries
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY YEAR(created_at), MONTH(created_at);
      `;
    }

    const [trendRows] = await db.query(trendQuery);
    res.json(trendRows);

  } catch (err) {
    console.error('❌ Error fetching inquiries analytics:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

module.exports = router;
