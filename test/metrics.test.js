const request = require('supertest');
const app = require('../src/app');

describe('GET /metrics', () => {
  it('returns 200 with Prometheus-formatted metrics', async () => {
    // Make a request to generate at least one metric point
    await request(app).get('/health');

    const res = await request(app).get('/metrics');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);

    // Verify default NodeJS metrics are exposed
    expect(res.text).toContain('process_cpu_user_seconds_total');

    // Verify RED HTTP metrics are recorded
    expect(res.text).toContain('http_request_duration_seconds');
    expect(res.text).toContain('app="notes-api"');
  });
});
