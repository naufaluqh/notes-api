const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/db');
const { runMigrations } = require('../db/migrate');

const migrationFiles = fs
  .readdirSync(path.join(__dirname, '../db/migrations'))
  .filter((file) => file.endsWith('.sql'))
  .sort();

beforeEach(async () => {
  // Safety guard: only ever touch a test database.
  if (!String(process.env.POSTGRES_DB).endsWith('_test')) {
    throw new Error('Refusing to run against a database whose name does not end with "_test"');
  }
  await pool.query('DROP TABLE IF EXISTS schema_migrations');
});

afterAll(() => pool.end());

describe('runMigrations', () => {
  it('applies pending migrations and records each one', async () => {
    const ran = await runMigrations(pool);

    expect(ran).toEqual(migrationFiles);

    const { rows } = await pool.query('SELECT count(*)::int AS total FROM schema_migrations');
    expect(rows[0].total).toBe(migrationFiles.length);
  });

  it('does nothing when it is run a second time', async () => {
    await runMigrations(pool);
    const second = await runMigrations(pool);

    expect(second).toEqual([]);
  });
});
