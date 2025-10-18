const express = require('express');
const router = express.Router();
const db = require('../models/db'); // adjust path if needed

/* ========================================
   📊 ANALYTICS CONTROLLER
======================================== */

/**
 * 🟣 GET /api/analytics/kpis
 * Returns key performance indicators for dashboard
 * - Total Inquiries
 * - Total Feedbacks
 * - Average Ratings
 * - Growth Rate (month-over-month inquiries)
 */
router.get('/kpis', async (req, res) => {
  try {
    // 1️⃣ Total Inquiries
    const [inqRows] = await db.query('SELECT COUNT(*) AS totalInquiries FROM inquiries');

    // 2️⃣ Total Feedbacks
    const [fbRows] = await db.query('SELECT COUNT(*) AS totalFeedbacks FROM feedbacks');

    // 3️⃣ Average Ratings (overall, service, satisfaction, response)
    const [ratingRows] = await db.query(`
      SELECT 
        AVG(overall_rating) AS avgOverall,
        AVG(service_rating) AS avgService,
        AVG(satisfaction_rating) AS avgSatisfaction,
        AVG(response_rating) AS avgResponse
      FROM feedbacks
    `);

    // 4️⃣ Growth (compare this month vs last month inquiries)
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

    // ✅ Response to frontend
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
 * Used for charts and filters in Analytics page
 */
router.get('/inquiries', async (req, res) => {
  const { period, summary } = req.query;

  try {
    // ✅ Summary Mode (total inquiries count)
    if (summary === 'true') {
      let countQuery = 'SELECT COUNT(*) AS total FROM inquiries';

      if (period === 'week') {
        countQuery += ' WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
      } else if (period === 'month') {
        countQuery += ' WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
      } else if (period === 'year') {
        countQuery += ' WHERE YEAR(created_at) = YEAR(CURDATE())';
      }

      const [rows] = await db.query(countQuery);
      return res.json({ total: rows[0].total });
    }

    // ✅ Trend Mode (chart data)
    let trendQuery;
    if (period === 'week') {
      trendQuery = `
        SELECT DAYNAME(created_at) AS label, COUNT(*) AS count
        FROM inquiries
        WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
        GROUP BY DAYNAME(created_at)
        ORDER BY created_at ASC;
      `;
    } else if (period === 'month') {
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%e %b') AS label, COUNT(*) AS count
        FROM inquiries
        WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
        GROUP BY DAY(created_at)
        ORDER BY created_at ASC;
      `;
    } else if (period === 'year') {
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%b') AS label, COUNT(*) AS count
        FROM inquiries
        WHERE YEAR(created_at) = YEAR(CURDATE())
        GROUP BY MONTH(created_at)
        ORDER BY MONTH(created_at) ASC;
      `;
    } else {
      // Default to month
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%e %b') AS label, COUNT(*) AS count
        FROM inquiries
        WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())
        GROUP BY DAY(created_at)
        ORDER BY created_at ASC;
      `;
    }

    const [trendRows] = await db.query(trendQuery);
    res.json(trendRows);

  } catch (err) {
    console.error('❌ Error fetching analytics inquiries:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

module.exports = router;
