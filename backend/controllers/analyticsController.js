const express = require('express');
const router = express.Router();
const db = require('../models/db');

/* ========================================
   📊 ANALYTICS CONTROLLER (Updated)
   ➕ Now supports custom date range filters
======================================== */

/**
 * 🟣 GET /api/analytics/inquiries
 * Query Params:
 *  - period = week | month | year | custom
 *  - summary = true | false
 *  - start, end = optional custom date range (YYYY-MM-DD)
 */
router.get('/inquiries', async (req, res) => {
  const { period, summary, start, end } = req.query;

  try {
    // ==========================================
    // 1️⃣ Summary Mode (total inquiries only)
    // ==========================================
    if (summary === 'true') {
      let countQuery = 'SELECT COUNT(*) AS total FROM inquiries';
      let queryParams = [];

      if (period === 'week') {
        countQuery += ' WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
      } else if (period === 'month') {
        countQuery += ' WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
      } else if (period === 'year') {
        countQuery += ' WHERE YEAR(created_at) = YEAR(CURDATE())';
      } else if (period === 'custom' && start && end) {
        countQuery += ' WHERE DATE(created_at) BETWEEN ? AND ?';
        queryParams = [start, end];
      }

      const [rows] = await db.query(countQuery, queryParams);
      return res.json({ total: rows[0].total });
    }

    // ==========================================
    // 2️⃣ Trend Mode (chart data)
    // ==========================================
    let trendQuery = '';
    let queryParams = [];

    if (period === 'custom' && start && end) {
      // 🗓️ Custom Range
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%e %b %Y') AS label, COUNT(*) AS count
        FROM inquiries
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY created_at ASC;
      `;
      queryParams = [start, end];
    } else if (period === 'week') {
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

    const [trendRows] = await db.query(trendQuery, queryParams);
    res.json(trendRows);

  } catch (err) {
    console.error('❌ Error fetching analytics inquiries:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

/**
 * 🟢 GET /api/analytics/services
 * Supports custom date range filtering for trends.
 */
router.get('/services', async (req, res) => {
  const { start, end, period } = req.query;

  try {
    // =============================
    // 1️⃣ Top Services
    // =============================
    let topServicesQuery = `
      SELECT service AS name, COUNT(*) AS total
      FROM records
      WHERE status = 'Completed'
    `;
    const queryParams = [];

    if (period === 'custom' && start && end) {
      topServicesQuery += ' AND DATE(date) BETWEEN ? AND ?';
      queryParams.push(start, end);
    }

    topServicesQuery += `
      GROUP BY service
      ORDER BY total DESC
      LIMIT 5
    `;

    const [topServices] = await db.query(topServicesQuery, queryParams);

    // =============================
    // 2️⃣ Trend Data
    // =============================
    let trendQuery = `
      SELECT DATE_FORMAT(date, '%b %Y') AS label, COUNT(*) AS count
      FROM records
      WHERE status = 'Completed'
    `;

    if (period === 'custom' && start && end) {
      trendQuery += ' AND DATE(date) BETWEEN ? AND ?';
      queryParams.push(start, end);
    }

    trendQuery += `
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY YEAR(date), MONTH(date)
    `;

    const [trend] = await db.query(trendQuery, queryParams);

    res.json({ topServices, trend });
  } catch (err) {
    console.error('❌ Error fetching services analytics:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

module.exports = router;
