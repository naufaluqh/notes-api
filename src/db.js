const { Pool, types } = require('pg');

// PostgreSQL BIGINT (type id 20) arrives as a string by default.
// Our ids stay far below Number.MAX_SAFE_INTEGER, so we return them as plain numbers.
types.setTypeParser(20, (value) => Number(value));

// Connection settings come from environment variables, never from the source code.
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

// Resiliency: prevent idle client network dropouts from crashing the entire Node.js process.
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

module.exports = pool;
