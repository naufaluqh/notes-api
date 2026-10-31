const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

afterAll(() => pool.end());

describe('GET /health', () => {
  it('returns 200 and status UP', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ status: 'UP' });
  });

  it('includes a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');

    expect(typeof res.body.timestamp).toBe('string');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('does not leak technology details via X-Powered-By header', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('GET /ready', () => {
  it('returns 200 and READY when database query succeeds', async () => {
    const res = await request(app).get('/ready');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'READY', database: 'UP' });
  });

  it('returns 503 and NOT_READY when database query fails', async () => {
    jest.spyOn(console, 'error').mockImplementationOnce(() => {});
    jest.spyOn(pool, 'query').mockRejectedValueOnce(new Error('connection timeout'));

    const res = await request(app).get('/ready');

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({ status: 'NOT_READY', database: 'DOWN' });
  });
});

describe('unknown routes', () => {
  it('returns 404 for a route that does not exist', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.statusCode).toBe(404);
  });
});
