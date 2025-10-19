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
router.get('/inquiries', async (req, res) => {
  const { period = 'month', mode = 'summary' } = req.query;

  try {
    // -----------------------------
    // 📊 SUMMARY MODE (KPI total)
    // -----------------------------
    if (mode === 'summary') {
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

    // -----------------------------
    // 📈 TREND MODE (chart data)
    // -----------------------------
    let trendQuery;
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
        SELECT DATE_FORMAT(created_at, '%b') AS label, COUNT(*) AS count
        FROM inquiries
        WHERE YEAR(created_at) = YEAR(CURDATE())
        GROUP BY MONTH(created_at)
        ORDER BY MONTH(created_at);
      `;
    }

    const [trendRows] = await db.query(trendQuery);
    res.json(trendRows);

  } catch (err) {
    console.error('❌ Error fetching analytics inquiries:', err);
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
