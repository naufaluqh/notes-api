const request = require('supertest');
const app = require('../src/app');

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
});

describe('unknown routes', () => {
  it('returns 404 for a route that does not exist', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.statusCode).toBe(404);
  });
});
