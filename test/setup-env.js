// Load local settings from .env when it exists (in CI the variables come from the environment).
try {
  process.loadEnvFile('.env');
} catch {
  // no .env file: rely on variables that are already set
}

// Tests always run against a dedicated database, never the development one.
process.env.POSTGRES_DB = 'notes_test';
