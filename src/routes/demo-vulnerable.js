const express = require('express');
const { Pool } = require('pg');

const pool = new Pool();
const router = express.Router();

// DELIBERATELY VULNERABLE (experiment only, never merge):
// user input is concatenated directly into the SQL text.
router.get('/search/:term', async (req, res) => {
  const result = await pool.query("SELECT * FROM notes WHERE title = '" + req.params.term + "'");
  res.json(result.rows);
});

module.exports = router;
