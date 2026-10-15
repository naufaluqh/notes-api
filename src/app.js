const express = require('express');
const pool = require('./db');
const notesRouter = require('./routes/notes');

const app = express();

// Error codes that mean "the database cannot be reached right now".
const DATABASE_UNAVAILABLE_CODES = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '57P01']);

app.use(express.json());

// Liveness: is the process alive?
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Readiness: can the app reach its database?
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'READY', database: 'UP' });
  } catch (err) {
    // Log the details on the server, but do not leak them to the client.
    console.error('Readiness check failed:', err.message);
    res.status(503).json({ status: 'NOT_READY', database: 'DOWN' });
  }
});

app.use('/notes', notesRouter);

// Unknown routes: answer with JSON instead of Express's default HTML page.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler: generic messages for clients, details only in the server log.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // A database outage is temporary and not a bug in our code, so it is a 503, not a 500.
  const code = err.code ?? err.errors?.[0]?.code;
  if (DATABASE_UNAVAILABLE_CODES.has(code)) {
    console.error('Database unavailable:', code);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
