// =======================================
// 📊 Inquiries by Period (Year, Month, Week)
// =======================================
router.get('/inquiries', async (req, res) => {
  const { period } = req.query; // 'yearly', 'monthly', or 'weekly'
  try {
    let query = '';

    if (period === 'weekly') {
      query = `
        SELECT WEEK(date) AS label, COUNT(*) AS count
        FROM inquiries
        GROUP BY WEEK(date)
        ORDER BY WEEK(date)
      `;
    } else if (period === 'monthly') {
      query = `
        SELECT MONTH(date) AS label, COUNT(*) AS count
        FROM inquiries
        GROUP BY MONTH(date)
        ORDER BY MONTH(date)
      `;
    } else { // Default: yearly
      query = `
        SELECT YEAR(date) AS label, COUNT(*) AS count
        FROM inquiries
        GROUP BY YEAR(date)
        ORDER BY YEAR(date)
      `;
    }

    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching inquiries:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
