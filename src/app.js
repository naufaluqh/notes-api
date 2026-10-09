const express = require('express');
const pool = require('./db');

const app = express();

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

module.exports = app;
