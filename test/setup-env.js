const fs = require('node:fs');
const { parseEnv } = require('node:util');

// Load local settings from .env when it exists (in CI the variables come from the environment).
// Values are copied into this test process explicitly, because Jest runs tests in a sandboxed process object.
if (fs.existsSync('.env')) {
  const values = parseEnv(fs.readFileSync('.env', 'utf8'));
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// Tests always run against a dedicated database, never the development one.
process.env.POSTGRES_DB = 'notes_test';
