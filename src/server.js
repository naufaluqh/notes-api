const app = require('./app');
const pool = require('./db');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Notes API listening on port ${PORT}`);
});

// Graceful shutdown: when Docker or Kubernetes sends SIGTERM/SIGINT, stop accepting new
// requests, wait for ongoing requests to finish, and drain database connections cleanly.
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);

  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('Database pool closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database pool:', err.message);
      process.exit(1);
    }
  });

  // Failsafe: force exit if open sockets prevent clean shutdown after 10s.
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
