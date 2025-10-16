const express = require('express');
const router = express.Router();
const db = require('../models/db'); // database connection

/* ========================================
   📥 Create a new record
======================================== */
router.post('/', (req, res) => {
  const { clientName, email, contact, address, serviceAvailed, date } = req.body;

  if (!clientName || !email || !contact || !address || !serviceAvailed || !date) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = `
    INSERT INTO records (client_name, email, contact, address, service, date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [clientName, email, contact, address, serviceAvailed, date, 'Pending'], (err, result) => {
    if (err) {
      console.error('❌ Error inserting record:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: '✅ Record added successfully', id: result.insertId });
  });
});

/* ========================================
   📤 Get all records
======================================== */
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM records ORDER BY id DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error fetching records:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

/* ========================================
   ✏️ Update a record
======================================== */
router.put('/:id', (req, res) => {
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

  db.query(sql, [clientName, email, contact, address, serviceAvailed, date, status, id], (err) => {
    if (err) {
      console.error('❌ Error updating record:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: '✅ Record updated successfully' });
  });
});

/* ========================================
   🗑️ Delete a record
======================================== */
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM records WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('❌ Error deleting record:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: '🗑️ Record deleted successfully' });
  });
});

/* ========================================
   🔍 Search records by name, email, or service
======================================== */
router.get('/search', (req, res) => {
  const { query } = req.query;

  const sql = `
    SELECT * FROM records
    WHERE client_name LIKE ? 
      OR email LIKE ?
      OR contact LIKE ?
      OR address LIKE ?
      OR service LIKE ?
  `;

  const likeQuery = `%${query}%`;

  db.query(sql, [likeQuery, likeQuery, likeQuery, likeQuery, likeQuery], (err, results) => {
    if (err) {
      console.error('❌ Error searching records:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

module.exports = router;
