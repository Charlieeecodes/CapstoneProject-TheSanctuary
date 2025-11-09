const express = require('express');
const router = express.Router();
const db = require('../models/db'); // promise-based database connection

/* ========================================
   📥 Create a new record
======================================== */
router.post('/', async (req, res) => {
  const { clientName, email, contact, address, serviceAvailed, cost, date } = req.body;

  if (!clientName || !email || !contact || !address || !serviceAvailed || !cost || !date) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = `
    INSERT INTO records (client_name, email, contact, address, service, cost, date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(sql, [
      clientName,
      email,
      contact,
      address,
      serviceAvailed,
      cost,
      date,
      'Pending'
    ]);
    res.json({ message: '✅ Record added successfully', id: result.insertId });
  } catch (err) {
    console.error('❌ Error inserting record:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


/* ========================================
   ✏️ Update a record
======================================== */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { clientName, email, contact, address, serviceAvailed, cost, date, status } = req.body;

  if (!clientName || !email || !contact || !address || !serviceAvailed || !cost || !date || !status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = `
    UPDATE records 
    SET client_name=?, email=?, contact=?, address=?, service=?, cost=?, date=?, status=? 
    WHERE id=?
  `;

  try {
    const [result] = await db.query(sql, [
      clientName,
      email,
      contact,
      address,
      serviceAvailed,
      cost,
      date,
      status,
      id
    ]);

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: '✅ Record updated successfully' });
  } catch (err) {
    console.error('❌ Error updating record:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


/* ========================================
   🗑️ Delete a record
======================================== */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM records WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: '🗑️ Record deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting record:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


/* ========================================
   🔍 Search records by name, email, contact, address, or service
======================================== */
router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Search query is required' });

  const sql = `
    SELECT * FROM records
    WHERE client_name LIKE ? 
      OR email LIKE ?
      OR contact LIKE ?
      OR address LIKE ?
      OR service LIKE ?
  `;
  const likeQuery = `%${query}%`;

  try {
    const [results] = await db.query(sql, [likeQuery, likeQuery, likeQuery, likeQuery, likeQuery]);
    res.json(results);
  } catch (err) {
    console.error('❌ Error searching records:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


/* ========================================
   📤 Get all records + Combined filters
======================================== */
router.get('/', async (req, res) => {
  try {
    const { service, status, startDate, endDate } = req.query;

    let sql = "SELECT * FROM records";
    const params = [];
    const conditions = [];

    if (service) {
      conditions.push("service LIKE ?");
      params.push(`%${service}%`);
    }

    if (status) {
      conditions.push("LOWER(status) = LOWER(?)");
      params.push(status);
    }

    // ✅ Handle date range
    if (startDate && endDate) {
      conditions.push("DATE(date) BETWEEN DATE(?) AND DATE(?)");
      params.push(startDate, endDate);
    } else if (startDate) {
      conditions.push("DATE(date) >= DATE(?)");
      params.push(startDate);
    } else if (endDate) {
      conditions.push("DATE(date) <= DATE(?)");
      params.push(endDate);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY date DESC";
    const [rows] = await db.query(sql, params);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching records with filters:', err);
    res.status(500).json({ message: "Database error", error: err });
  }
});


/* ========================================
   📂 Upload CSV to Database
======================================== */
router.post('/upload-csv', async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: '⚠️ No data received. Please upload a valid CSV file.',
      });
    }

    // 🧾 Standardized service price map
    const servicePrices = {
      "Unit with perpetual care": 50000,
      "Interment service": 10000,
      "Retrieval of cadaver": 7000,
      "Embalming services": 5000,
      "Casket": 15000,
      "Chapel viewing": 8000,
      "House viewing or outside viewing": 6000,
      "Hearse": 4000,
      "Funeral Mass": 2000,
      "Function area": 3000,
      "Adult cremation": 15000,
      "Child cremation": 10000,
      "Baby cremation": 8000,
      "Fetus cremation": 6000,
      "Bone cremation": 5000,
      "Urns": 3000,
      "Keepsakes": 1200,
      "Chapel A (30-50 pax)": 150000,
      "Chapel B (75-100 pax)": 250000,
      "Main Chapel (100-150 pax)": 350000
    };

    const insertSQL = `
      INSERT INTO records (client_name, email, contact, address, service, cost, date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    let inserted = 0;

    for (const r of records) {
      // 🧠 Normalize the service text (fix casing + extra spaces)
      const cleanService = (r.service || '').trim();

      // 💰 Auto-compute cost if not provided
      const autoCost = r.cost && Number(r.cost) > 0
        ? Number(r.cost)
        : servicePrices[cleanService] || 0;

      await db.query(insertSQL, [
        r.client_name || null,
        r.email || null,
        r.contact || null,
        r.address || null,
        cleanService,
        autoCost,
        r.date || null,
        r.status || 'Pending'
      ]);

      inserted++;
    }

    return res.status(200).json({
      success: true,
      message: `✅ Upload complete! ${inserted} record(s) successfully added with computed costs.`,
    });

  } catch (error) {
    console.error('❌ Error processing CSV upload:', error);
    return res.status(500).json({
      success: false,
      message: '🚨 Server error during CSV upload.',
      error: error.message,
    });
  }
});


module.exports = router;
