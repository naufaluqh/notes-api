const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');
const { migrate, resetNotes } = require('./helpers/db');

beforeAll(migrate);
beforeEach(resetNotes);
afterAll(() => pool.end());

describe('POST /notes', () => {
  it('creates a note and returns 201 with the stored note', async () => {
    const res = await request(app)
      .post('/notes')
      .send({ title: 'Shopping list', body: 'milk, eggs' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ title: 'Shopping list', body: 'milk, eggs' });
    expect(res.body.id).toBeDefined();
  });

  it('uses an empty body when none is given', async () => {
    const res = await request(app).post('/notes').send({ title: 'Only a title' });

    expect(res.statusCode).toBe(201);
    expect(res.body.body).toBe('');
  });

  it('rejects a missing title with 400', async () => {
    const res = await request(app).post('/notes').send({ body: 'no title' });

    expect(res.statusCode).toBe(400);
  });

  it('rejects a title longer than 200 characters with 400', async () => {
    const res = await request(app).post('/notes').send({ title: 'a'.repeat(201) });

    expect(res.statusCode).toBe(400);
  });

  it('rejects malformed JSON with 400 and a generic message', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Content-Type', 'application/json')
      .send('{"title": ');

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid JSON' });
  });

  it('stores SQL-looking input as plain text (no SQL injection)', async () => {
    const nasty = "x'); DROP TABLE notes;--";
    const res = await request(app).post('/notes').send({ title: nasty });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(nasty);

    const { rows } = await pool.query('SELECT count(*)::int AS total FROM notes');
    expect(rows[0].total).toBe(1);
  });

  it('rejects a body longer than 50000 characters with 400', async () => {
    const res = await request(app)
      .post('/notes')
      .send({ title: 'Valid title', body: 'b'.repeat(50001) });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'body must be 50000 characters or fewer' });
  });

  it('trims leading and trailing whitespace from the title before storing', async () => {
    const res = await request(app)
      .post('/notes')
      .send({ title: '   Whitespace Title   ', body: 'text' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Whitespace Title');
  });
});
