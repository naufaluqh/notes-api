const express = require('express');
const pool = require('../db');

const router = express.Router();

router.post('/', async (req, res, next) => {
  const { title, body = '' } = req.body ?? {};

  if (typeof title !== 'string' || title.trim().length < 1 || title.length > 200) {
    return res.status(400).json({ error: 'title must be a string of 1 to 200 characters' });
  }
  if (typeof body !== 'string') {
    return res.status(400).json({ error: 'body must be a string' });
  }

  try {
    // Parameterized query: the values travel separately from the SQL text.
    const { rows } = await pool.query(
      'INSERT INTO notes (title, body) VALUES ($1, $2) RETURNING id, title, body, created_at, updated_at',
      [title, body]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
