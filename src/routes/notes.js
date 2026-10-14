const express = require('express');
const pool = require('../db');

const router = express.Router();

// List notes: newest first, capped so one request can never return an unbounded amount of data.
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, body, created_at, updated_at FROM notes ORDER BY created_at DESC, id DESC LIMIT 100'
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

// Read one note by id.
router.get('/:id', async (req, res, next) => {
  const id = Number(req.params.id);

  // Reject anything that is not a positive whole number before it reaches the database.
  if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, title, body, created_at, updated_at FROM notes WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

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
