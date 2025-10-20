const express = require('express');
const router = express.Router();
const db = require('../models/db');

/* ========================================
   📊 ANALYTICS CONTROLLER
======================================== */

/**
 * 🟣 GET /api/analytics/kpis
 * Returns dashboard key performance indicators
 */
router.get('/kpis', async (req, res) => {
  try {
    // 1️⃣ Total Inquiries
    const [inqRows] = await db.query('SELECT COUNT(*) AS totalInquiries FROM inquiries');

    // 2️⃣ Total Feedbacks
    const [fbRows] = await db.query('SELECT COUNT(*) AS totalFeedbacks FROM feedbacks');

    // 3️⃣ Total Services Availed (Completed)
    const [svcRows] = await db.query(`
      SELECT COUNT(*) AS totalServices
      FROM records
      WHERE status = 'Completed'
    `);

    // 4️⃣ Top Service Availed (Completed)
    const [topServiceRow] = await db.query(`
      SELECT service, COUNT(*) AS total
      FROM records
      WHERE status = 'Completed'
      GROUP BY service
      ORDER BY total DESC
      LIMIT 1
    `);
    const topService = topServiceRow.length ? topServiceRow[0].service : 'N/A';

    // 5️⃣ Average Ratings (6 categories)
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
 */
router.get('/inquiries', async (req, res) => {
  const { period = 'month', mode = 'summary' } = req.query;
  try {
    if (mode === 'summary') {
      let sql = 'SELECT COUNT(*) AS total FROM inquiries';
      if (period === 'week') sql += ' WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
      else if (period === 'month') sql += ' WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())';
      else if (period === 'year') sql += ' WHERE YEAR(created_at)=YEAR(CURDATE())';

      const [rows] = await db.query(sql);
      return res.json({ total: rows[0].total });
    }

    // Trend mode
    let trendQuery = '';
    if (period === 'week') {
      trendQuery = `
        SELECT DAYNAME(created_at) AS label, COUNT(*) AS count
        FROM inquiries
        WHERE YEARWEEK(created_at, 1)=YEARWEEK(CURDATE(), 1)
        GROUP BY DAYOFWEEK(created_at)
        ORDER BY DAYOFWEEK(created_at);
      `;
    } else if (period === 'month') {
      trendQuery = `
        SELECT DATE_FORMAT(created_at, '%e %b') AS label, COUNT(*) AS count
        FROM inquiries
        WHERE MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())
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

/* ========================================
   🟣 SERVICES ANALYTICS ROUTES
======================================== */

// ✅ Top services (Horizontal Bar Chart)
router.get('/services/top', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        CASE
          WHEN service LIKE 'Columbarium%' THEN 'Columbarium'
          WHEN service LIKE 'Cremation Services%' THEN 'Cremation Services'
          WHEN service LIKE 'Funeral Service%' THEN 'Funeral Service'
          WHEN service LIKE 'Other Services%' THEN 'Other Services'
          ELSE 'Uncategorized'
        END AS category,
        COUNT(*) AS total
      FROM datarecords
      WHERE status = 'Completed'
      GROUP BY category
      ORDER BY total DESC;
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching top services:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});


// ✅ Total services availed trend (Line Chart)
router.get('/services/trend', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%b %Y') AS month, COUNT(*) AS total
      FROM records
      WHERE status = 'Completed'
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at), MONTH(created_at);
    `);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching service trend:', err);
    res.status(500).json({ message: 'Database error', error: err.message });
  }
});

module.exports = router;
