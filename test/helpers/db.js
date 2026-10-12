const fs = require('node:fs');
const path = require('node:path');
const pool = require('../../src/db');

// Safety guard: refuse to run destructive helpers against anything but a test database.
function assertTestDatabase() {
  if (!String(process.env.POSTGRES_DB).endsWith('_test')) {
    throw new Error('Refusing to touch a database whose name does not end with "_test"');
  }
}

async function migrate() {
  assertTestDatabase();
  const dir = path.join(__dirname, '../../db/migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    await pool.query(fs.readFileSync(path.join(dir, file), 'utf8'));
  }
}

async function resetNotes() {
  assertTestDatabase();
  await pool.query('TRUNCATE notes RESTART IDENTITY');
}

module.exports = { migrate, resetNotes };
