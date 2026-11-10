const client = require('prom-client');

// Create a custom registry to avoid pollution and support clean isolation
const register = new client.Registry();

// Add a default label to all metrics (useful in multi-instance environments)
register.setDefaultLabels({
  app: 'notes-api',
});

// Collect NodeJS process and runtime metrics (memory, CPU, event loop, GC)
client.collectDefaultMetrics({ register });

// RED Method: Histogram tracking Request Rate, Errors, and Duration (latency)
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  // Buckets tuned for API response times (from 5ms to 5s)
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// Middleware to measure duration for every incoming HTTP request
function metricsMiddleware(req, res, next) {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;

    // Security: normalize route to prevent Cardinality Explosion DoS.
    // Instead of logging `/notes/123`, we log `/notes/:id` using Express route path.
    const route = req.route ? `${req.baseUrl || ''}${req.route.path}` : (req.baseUrl || req.path || 'unknown');

    httpRequestDurationSeconds
      .labels(req.method, route, String(res.statusCode))
      .observe(durationInSeconds);
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
};
