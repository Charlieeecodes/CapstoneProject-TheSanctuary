const express = require('express');
const router = express.Router();
const db = require('../models/db'); // adjust if your db.js path is different

/* ========================================
   📊 ANALYTICS CONTROLLER
======================================== */

/**
 * 🟣 GET /api/analytics/inquiries
 * Returns inquiry analytics based on the selected period (week, month, year)
 * Supports trend (chart data) and summary (total count)
 */
router.get('/inquiries', async (req, res) => {
  const { period, summary } = req.query;

  try {
    // ==========================================
    // 1️⃣ Summary Mode (total inquiries only)
    // ==========================================
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

    // ==========================================
    // 2️⃣ Trend Mode (chart data)
    // ==========================================
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
      // Default to current month
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
router.get('/services', async (req, res) => {
  try {
    // Top Services
    const [topServices] = await db.query(`
      SELECT service AS name, COUNT(*) AS total
      FROM records
      WHERE status = 'Completed'
      GROUP BY service
      ORDER BY total DESC
      LIMIT 5
    `);

    // Service Trend
    const [trend] = await db.query(`
      SELECT DATE_FORMAT(date, '%b %Y') AS label, COUNT(*) AS count
      FROM records
      WHERE status = 'Completed'
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY YEAR(date), MONTH(date)
    `);

    res.json({ topServices, trend });
  } catch (err) {
    console.error('❌ Error fetching services analytics:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});


module.exports = router;
