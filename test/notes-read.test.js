const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');
const { migrate, resetNotes } = require('./helpers/db');

beforeAll(migrate);
beforeEach(resetNotes);
afterAll(() => pool.end());

async function createNote(title, body = '') {
  const res = await request(app).post('/notes').send({ title, body });
  return res.body;
}

describe('GET /notes', () => {
  it('returns an empty array when there are no notes', async () => {
    const res = await request(app).get('/notes');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns notes with the newest first', async () => {
    await createNote('first');
    await createNote('second');

    const res = await request(app).get('/notes');

    expect(res.statusCode).toBe(200);
    expect(res.body.map((note) => note.title)).toEqual(['second', 'first']);
  });

  it('returns ids as numbers', async () => {
    await createNote('numeric id');

    const res = await request(app).get('/notes');

    expect(typeof res.body[0].id).toBe('number');
  });
});

describe('GET /notes/:id', () => {
  it('returns the note when it exists', async () => {
    const created = await createNote('find me', 'body text');

    const res = await request(app).get(`/notes/${created.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: created.id, title: 'find me', body: 'body text' });
  });

  it('returns 404 when the note does not exist', async () => {
    const res = await request(app).get('/notes/999999');

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'Note not found' });
  });

  it('returns 400 when the id is not a positive integer', async () => {
    for (const badId of ['abc', '0', '-5', '1.5']) {
      const res = await request(app).get(`/notes/${badId}`);

      expect(res.statusCode).toBe(400);
    }
  });

  it('returns 400 for an id too large to be a safe integer', async () => {
    const res = await request(app).get('/notes/99999999999999999999');

    expect(res.statusCode).toBe(400);
  });
});
