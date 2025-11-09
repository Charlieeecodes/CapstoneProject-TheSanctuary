const express = require('express');
const router = express.Router();
const db = require('../models/db');

/**
 * 🟣 GET /api/analytics/kpis
 * Returns dashboard KPIs: inquiries, feedbacks, services, top service, ratings
 */
router.get('/kpis', async (req, res) => {
  try {
    // Total Inquiries
    const [inqRows] = await db.query('SELECT COUNT(*) AS totalInquiries FROM inquiries');

    // Total Feedbacks
    const [fbRows] = await db.query('SELECT COUNT(*) AS totalFeedbacks FROM feedbacks');

    // Total Services Availed (Completed only)
    const [svcRows] = await db.query(`
      SELECT COUNT(*) AS totalServices
      FROM records
      WHERE status = 'Completed'
    `);

    // Top Service Availed
    const [topServiceRow] = await db.query(`
      SELECT service, COUNT(*) AS total
      FROM records
      WHERE status = 'Completed'
      GROUP BY service
      ORDER BY total DESC
      LIMIT 1
    `);
    const topService = topServiceRow.length ? topServiceRow[0].service : 'N/A';

    // Average Ratings (6 categories)
    const [ratingRows] = await db.query(`
      SELECT 
        AVG(overall_rating) AS avgOverall,
        AVG(service_rating) AS avgService,
        AVG(satisfaction_rating) AS avgSatisfaction,
        AVG(professionalism_rating) AS avgProfessionalism,
        AVG(communication_rating) AS avgCommunication,
        AVG(facility_rating) AS avgFacility
      FROM feedbacks
    `);

    res.json({
      totalInquiries: inqRows[0].totalInquiries,
      totalFeedbacks: fbRows[0].totalFeedbacks,
      totalServices: svcRows[0].totalServices,
      topService,
      avgRatings: {
        overall: parseFloat(ratingRows[0].avgOverall || 0).toFixed(2),
        service: parseFloat(ratingRows[0].avgService || 0).toFixed(2),
        satisfaction: parseFloat(ratingRows[0].avgSatisfaction || 0).toFixed(2),
        professionalism: parseFloat(ratingRows[0].avgProfessionalism || 0).toFixed(2),
        communication: parseFloat(ratingRows[0].avgCommunication || 0).toFixed(2),
        facility: parseFloat(ratingRows[0].avgFacility || 0).toFixed(2)
      }
    });
  } catch (err) {
    console.error('❌ Error fetching KPIs:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

/**
 * 🟣 GET /api/analytics/inquiries
 * Returns inquiry analytics (summary + trend)
 * Supports ?period=week|month|year|custom&start=YYYY-MM-DD&end=YYYY-MM-DD
 */
router.get('/inquiries', async (req, res) => {
  const { period = 'month', mode = 'summary', start, end } = req.query;

  try {
    // ✅ SUMMARY MODE
    if (mode === 'summary') {
      let summaryQuery = 'SELECT COUNT(*) AS total FROM inquiries';
      let condition = '';
      const params = [];

      if (period === 'week') {
        condition = 'WHERE DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()';
      } else if (period === 'month') {
        condition = 'WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
      } else if (period === 'year') {
        condition = 'WHERE YEAR(created_at) = YEAR(CURDATE())';
      } else if (period === 'custom' && start && end) {
        condition = 'WHERE DATE(created_at) BETWEEN ? AND ?';
        params.push(start, end);
      }

      const [rows] = await db.query(`${summaryQuery} ${condition}`, params);
      return res.json({ total: rows[0]?.total ?? 0 });
    }

    // ✅ TREND MODE
    let trendQuery = '';
    let params = [];

    if (period === 'week') {
      trendQuery = `
        SELECT DATE_FORMAT(d, '%a') AS label, COALESCE(COUNT(i.id), 0) AS count
        FROM (
          SELECT CURDATE() - INTERVAL n DAY AS d
          FROM (
            SELECT 0 n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
                  SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
          ) AS x
        ) days
        LEFT JOIN inquiries i ON DATE(i.created_at) = days.d
        GROUP BY d
        ORDER BY d;
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
        WHERE YEAR(created_at) = YEAR(CURDATE())
        GROUP BY MONTH(created_at)
        ORDER BY MONTH(created_at);
      `;
    } else if (period === 'custom' && start && end) {
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%e %b %Y') AS label, COUNT(*) AS count
        FROM inquiries
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at);
      `;
      params = [start, end];
    }

    const [trendRows] = await db.query(trendQuery, params);
    res.json(trendRows);
  } catch (err) {
    console.error('❌ Error fetching inquiries analytics:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

/**
 * 🟣 GET /api/analytics/services/top
 * Returns top 5 services based on selected period or custom range
 */
router.get('/services/top', async (req, res) => {
  const { period, start, end } = req.query;

  try {
    let topServicesQuery = `
      SELECT service AS name, COUNT(*) AS total
      FROM records
      WHERE status = 'Completed'
    `;
    const queryParams = [];

    if (period === 'week') {
      // ✅ Show data from the last 7 days
      topServicesQuery += ` AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    }
    else if (period === 'month') {
      // ✅ Fix: Use last 30 days instead of current calendar month
      topServicesQuery += ` AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    } 
    else if (period === 'year') {
      topServicesQuery += ` AND YEAR(date) = YEAR(CURDATE())`;
    } 
    else if (period === 'custom' && start && end) {
      topServicesQuery += ` AND DATE(date) BETWEEN ? AND ?`;
      queryParams.push(start, end);
    }

    topServicesQuery += `
      GROUP BY service
      ORDER BY total DESC
      LIMIT 10
    `;

    const [rows] = await db.query(topServicesQuery, queryParams);

    // 🪄 Optional fallback: If month data is still empty, widen to last 60 days
    if (rows.length === 0 && period === 'month') {
      console.log('⚠️ No recent records found — expanding to last 60 days');
      const fallbackQuery = `
        SELECT service AS name, COUNT(*) AS total
        FROM records
        WHERE status = 'Completed' AND DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
        GROUP BY service
        ORDER BY total DESC
        LIMIT 10
      `;
      const [fallbackRows] = await db.query(fallbackQuery);
      return res.json(fallbackRows);
    }

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching top services:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

router.get('/services/trend', async (req, res) => {
  const { period, start, end, status } = req.query;

  try {
    const queryParams = [];
    let statusFilter = '';

    // ✅ Allow dynamic status filter (default to all statuses)
    if (status && status !== 'All') {
      statusFilter = 'AND LOWER(status) = LOWER(?)';
      queryParams.push(status);
    }

    let trendQuery = '';

    if (period === 'custom' && start && end) {
      trendQuery = `
        SELECT DATE_FORMAT(date, '%e %b %Y') AS label, COUNT(*) AS count
        FROM records
        WHERE DATE(date) BETWEEN ? AND ?
        ${statusFilter}
        GROUP BY DATE(date)
        ORDER BY DATE(date) ASC;
      `;
      queryParams.unshift(start, end);
    } else if (period === 'week') {
      trendQuery = `
        SELECT DATE_FORMAT(date, '%e %b') AS label, COUNT(*) AS count
        FROM records
        WHERE DATE(date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ${statusFilter}
        GROUP BY DATE(date)
        ORDER BY DATE(date) ASC;
      `;
    } else if (period === 'month') {
      trendQuery = `
        SELECT DATE_FORMAT(date, '%e %b') AS label, COUNT(*) AS count
        FROM records
        WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
        ${statusFilter}
        GROUP BY DAY(date)
        ORDER BY DATE(date) ASC;
      `;
    } else if (period === 'year') {
      trendQuery = `
        SELECT DATE_FORMAT(date, '%b') AS label, COUNT(*) AS count
        FROM records
        WHERE YEAR(date) = YEAR(CURDATE())
        ${statusFilter}
        GROUP BY MONTH(date)
        ORDER BY MONTH(date) ASC;
      `;
    } else {
      // Default to current month if period not specified
      trendQuery = `
        SELECT DATE_FORMAT(date, '%e %b') AS label, COUNT(*) AS count
        FROM records
        WHERE MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
        ${statusFilter}
        GROUP BY DAY(date)
        ORDER BY DATE(date) ASC;
      `;
    }

    const [rows] = await db.query(trendQuery, queryParams);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching service trend:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

/**
 * 🧠 GET /api/analytics/predictive
 * Predicts future inquiry or service counts (simple trend-based projection)
 * Query: ?type=inquiries|services
 */
router.get('/predictive', async (req, res) => {
  const { type = 'inquiries' } = req.query;

  try {
    let baseQuery = '';
    if (type === 'inquiries') {
      baseQuery = `
        SELECT DATE_FORMAT(created_at, '%b %Y') AS label, COUNT(*) AS count
        FROM inquiries
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY YEAR(created_at), MONTH(created_at)
        LIMIT 6;
      `;
    } else if (type === 'services') {
      baseQuery = `
        SELECT DATE_FORMAT(date, '%b %Y') AS label, COUNT(*) AS count
        FROM records
        WHERE status = 'Completed'
        GROUP BY YEAR(date), MONTH(date)
        ORDER BY YEAR(date), MONTH(date)
        LIMIT 6;
      `;
    } else {
      return res.status(400).json({ message: 'Invalid type parameter' });
    }

    const [rows] = await db.query(baseQuery);
    if (!rows.length) return res.json({ forecast: 0, growthRate: 0 });

    const counts = rows.map(r => Number(r.count));
    const avgGrowth = counts.length > 1
      ? ((counts[counts.length - 1] - counts[0]) / counts[0]) * 100
      : 0;
    const forecast = Math.round(counts[counts.length - 1] * (1 + avgGrowth / 100));

    res.json({
      lastPeriod: counts[counts.length - 1],
      forecast,
      growthRate: avgGrowth.toFixed(2),
      dataset: rows
    });
  } catch (err) {
    console.error('❌ Predictive analytics error:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});
/**
 * 🟡 GET /api/analytics/feedbacks/ratings
 * Supports period filters: week | month | year | custom
 */
router.get('/feedbacks/ratings', async (req, res) => {
  const { period, start, end } = req.query;

  try {
    let filter = '';
    const params = [];

    if (period === 'week') {
      filter = `AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
    } else if (period === 'month') {
      filter = `AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    } else if (period === 'year') {
      filter = `AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)`;
    } else if (period === 'custom' && start && end) {
      filter = `AND DATE(created_at) BETWEEN ? AND ?`;
      params.push(start, end);
    }

    const [rows] = await db.query(
      `
      SELECT
        ROUND(AVG(overall_rating), 2) AS overall,
        ROUND(AVG(service_rating), 2) AS service,
        ROUND(AVG(satisfaction_rating), 2) AS satisfaction,
        ROUND(AVG(professionalism_rating), 2) AS professionalism,
        ROUND(AVG(communication_rating), 2) AS communication,
        ROUND(AVG(facility_rating), 2) AS facility
      FROM feedbacks
      WHERE 1=1 ${filter};
      `,
      params
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error fetching feedback ratings:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});
router.get('/feedbacks/count', async (req, res) => {
  const { period } = req.query;
  let dateFilter = '';

  if (period === 'week') {
    dateFilter = 'AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  } else if (period === 'month') {
    dateFilter = 'AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
  } else if (period === 'year') {
    dateFilter = 'AND YEAR(created_at) = YEAR(CURDATE())';
  }

  const query = `
    SELECT COUNT(*) AS total
    FROM feedbacks
    WHERE 1=1 ${dateFilter};
  `;
  
  try {
    const [rows] = await db.query(query);
    res.json({ total: rows[0].total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching feedback count' });
  }
});

module.exports = router;
