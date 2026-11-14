const request = require('supertest');
const app = require('../src/app');
const { register } = require('../src/metrics');

beforeEach(() => register.resetMetrics());

describe('GET /metrics', () => {
  it('groups unknown URLs into one route label instead of storing raw paths', async () => {
    for (const path of ['/unknown-one', '/unknown-two', '/notes/123/unknown']) {
      const res = await request(app).get(path);
      expect(res.statusCode).toBe(404);
    }

    const metric = await register.getSingleMetric('http_request_duration_seconds').get();
    const counts = metric.values.filter((value) => value.metricName.endsWith('_count'));

    expect(counts).toHaveLength(1);
    expect(counts[0].labels).toMatchObject({
      method: 'GET', route: 'unmatched', status_code: '404',
    });
    expect(counts[0].value).toBe(3);
  });

  it('groups note IDs into a route template without accessing the database', async () => {
    for (const id of ['invalid-one', 'invalid-two']) {
      const res = await request(app).get(`/notes/${id}`);
      expect(res.statusCode).toBe(400);
    }

    const metric = await register.getSingleMetric('http_request_duration_seconds').get();
    const counts = metric.values.filter((value) => value.metricName.endsWith('_count'));

    expect(counts).toHaveLength(1);
    expect(counts[0].labels.route).toMatch(/\/:id$/);
    expect(counts[0].value).toBe(2);
  });
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
