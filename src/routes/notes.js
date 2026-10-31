const express = require('express');
const pool = require('../db');

const router = express.Router();

// Returns a positive safe integer, or null when the value is not one.
function parseId(raw) {
  const id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) {
    return null;
  }
  return id;
}

// Returns an error message, or null when the payload is valid.
function validateNote({ title, body = '' }) {
  if (typeof title !== 'string' || title.trim().length < 1 || title.length > 200) {
    return 'title must be a string of 1 to 200 characters';
  }
  if (typeof body !== 'string') {
    return 'body must be a string';
  }
  if (body.length > 50000) {
    return 'body must be 50000 characters or fewer';
  }
  return null;
}

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
  const id = parseId(req.params.id);
  if (id === null) {
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

// Create a note.
router.post('/', async (req, res, next) => {
  const problem = validateNote(req.body ?? {});
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  const title = req.body.title.trim();
  const body = req.body.body ?? '';
  try {
    const { rows } = await pool.query(
      'INSERT INTO notes (title, body) VALUES ($1, $2) RETURNING id, title, body, created_at, updated_at',
      [title, body]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Replace the title and body of an existing note.
router.put('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  const problem = validateNote(req.body ?? {});
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  const title = req.body.title.trim();
  const body = req.body.body ?? '';
  try {
    const { rows } = await pool.query(
      'UPDATE notes SET title = $1, body = $2, updated_at = now() WHERE id = $3 RETURNING id, title, body, created_at, updated_at',
      [title, body, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(200).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Delete a note.
router.delete('/:id', async (req, res, next) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const result = await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
