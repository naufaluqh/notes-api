const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');
const { migrate, resetNotes } = require('./helpers/db');

beforeAll(migrate);
beforeEach(() => {
  // Keep the test output clean: the app logs errors on purpose.
  jest.spyOn(console, 'error').mockImplementation(() => {});
  return resetNotes();
});
afterEach(() => {
  jest.restoreAllMocks();
});
afterAll(() => pool.end());

describe('unknown routes', () => {
  it('returns a JSON 404 instead of an HTML page', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.statusCode).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

describe('missing notes', () => {
  it('PUT returns a specific JSON 404 for a note that does not exist', async () => {
    const res = await request(app).put('/notes/999999').send({ title: 'x' });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Note not found' });
  });

  it('DELETE returns a specific JSON 404 for a note that does not exist', async () => {
    const res = await request(app).delete('/notes/999999');

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Note not found' });
  });
});

describe('failures behind the API', () => {
  it('returns 503 without leaking connection details when the database is unreachable', async () => {
    const err = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
      code: 'ECONNREFUSED',
    });
    jest.spyOn(pool, 'query').mockRejectedValueOnce(err);

    const res = await request(app).get('/notes');

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ error: 'Service temporarily unavailable' });
    expect(JSON.stringify(res.body)).not.toContain('127.0.0.1');
  });

  it('returns a generic 500 for unexpected errors without leaking the message', async () => {
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('secret internal detail'));

    const res = await request(app).get('/notes');

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
    expect(JSON.stringify(res.body)).not.toContain('secret internal detail');
  });
});
