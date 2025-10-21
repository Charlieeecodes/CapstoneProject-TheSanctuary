const express = require('express');
const router = express.Router();
const db = require('../models/db'); // promise-based database connection

/* ========================================
   📥 Create a new record
======================================== */
router.post('/', async (req, res) => {
  const { clientName, email, contact, address, serviceAvailed, date } = req.body;

  if (!clientName || !email || !contact || !address || !serviceAvailed || !date) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = `
    INSERT INTO records (client_name, email, contact, address, service, date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(sql, [clientName, email, contact, address, serviceAvailed, date, 'Pending']);
    res.json({ message: '✅ Record added successfully', id: result.insertId });
  } catch (err) {
    console.error('❌ Error inserting record:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
/* ========================================
   ✅ Filter records by STATUS
   Example: /api/records/filterByStatus?status=Completed
======================================== */
router.get('/filterByStatus', async (req, res) => {
  try {
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({ message: "Status query parameter is required" });
    }

    const [rows] = await db.query(
      `SELECT * FROM records WHERE status = ? ORDER BY date DESC`,
      [status]
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Error filtering records by status:', err);
    res.status(500).json({ message: "Database error", error: err });
  }
});


/* ========================================
   📤 Get all records
======================================== */
router.get('/', async (req, res) => {
  const sql = 'SELECT * FROM records ORDER BY id DESC';
  try {
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error('❌ Error fetching records:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

/* ========================================
   ✏️ Update a record
======================================== */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { clientName, email, contact, address, serviceAvailed, date, status } = req.body;

  if (!clientName || !email || !contact || !address || !serviceAvailed || !date || !status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = `
    UPDATE records 
    SET client_name=?, email=?, contact=?, address=?, service=?, date=?, status=? 
    WHERE id=?
  `;

  try {
    const [result] = await db.query(sql, [clientName, email, contact, address, serviceAvailed, date, status, id]);
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
   ✅ Filter records by date
======================================== */
router.get('/filterByDate', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: "Date is required" });

  const sql = "SELECT * FROM records WHERE DATE(date) = ?";

  try {
    const [results] = await db.query(sql, [date]);
    res.json(results);
  } catch (err) {
    console.error('❌ Error filtering records by date:', err);
    res.status(500).json({ message: "Error filtering by date", error: err });
  }
});


module.exports = router;
