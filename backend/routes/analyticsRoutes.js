const express = require('express');
const router = express.Router();
const db = require('../models/db');

/* ========================================
   📊 ANALYTICS CONTROLLER (FULL FIX)
======================================== */

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
 */
router.get('/inquiries', async (req, res) => {
  const { period = 'month', mode = 'summary' } = req.query;

  try {
    if (mode === 'summary') {
      let summaryQuery = 'SELECT COUNT(*) AS total FROM inquiries';
    
      if (period === 'week') {
        summaryQuery += ' WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
      } else if (period === 'month') {
        summaryQuery += ' WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
      } else if (period === 'year') {
        summaryQuery += ' WHERE YEAR(created_at) = YEAR(CURDATE())';
      }
    
      const [rows] = await db.query(summaryQuery);
      return res.json({ total: rows[0].total });
    }
    

    // Trend mode (keep your existing code)
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


/**
 * 🟣 GET /api/analytics/services/top
 * Returns top availed services (Completed only)
 */
router.get('/services/top', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT service AS name, COUNT(*) AS total
      FROM records
      WHERE status = 'Completed'
      GROUP BY service
      ORDER BY total DESC
      LIMIT 5
    `);
    res.json(Array.isArray(rows) ? rows : []); // ensure array
  } catch (err) {
    console.error('❌ Error fetching top services:', err);
    res.json([]); // return empty array to prevent frontend crash
  }
});

/**
 * 🟣 GET /api/analytics/services/trend
 * Returns monthly trend of completed services
 */
router.get('/services/trend', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(date, '%b %Y') AS label, COUNT(*) AS count
      FROM records
      WHERE status = 'Completed'
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY YEAR(date), MONTH(date);
    `);
    res.json(Array.isArray(rows) ? rows : []); // ensure array
  } catch (err) {
    console.error('❌ Error fetching service trend:', err);
    res.json([]); // return empty array to prevent frontend crash
  }
});

module.exports = router;
