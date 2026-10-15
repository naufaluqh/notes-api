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

describe('PUT /notes/:id', () => {
  it('replaces title and body and returns the updated note', async () => {
    const created = await createNote('old title', 'old body');

    const res = await request(app)
      .put(`/notes/${created.id}`)
      .send({ title: 'new title', body: 'new body' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ id: created.id, title: 'new title', body: 'new body' });
    expect(new Date(res.body.updated_at).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updated_at).getTime()
    );

    const check = await request(app).get(`/notes/${created.id}`);
    expect(check.body.title).toBe('new title');
  });

  it('returns 404 when the note does not exist', async () => {
    const res = await request(app).put('/notes/999999').send({ title: 'x' });

    expect(res.statusCode).toBe(404);
  });

  it('returns 400 when the id is invalid', async () => {
    const res = await request(app).put('/notes/abc').send({ title: 'x' });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when the title is missing', async () => {
    const created = await createNote('keep me');

    const res = await request(app).put(`/notes/${created.id}`).send({ body: 'no title' });

    expect(res.statusCode).toBe(400);
  });
});

describe('DELETE /notes/:id', () => {
  it('deletes the note and returns 204', async () => {
    const created = await createNote('delete me');

    const res = await request(app).delete(`/notes/${created.id}`);
    expect(res.statusCode).toBe(204);

    const check = await request(app).get(`/notes/${created.id}`);
    expect(check.statusCode).toBe(404);
  });

  it('returns 404 when the note does not exist', async () => {
    const res = await request(app).delete('/notes/999999');

    expect(res.statusCode).toBe(404);
  });

  it('returns 404 when the same note is deleted twice', async () => {
    const created = await createNote('delete twice');

    await request(app).delete(`/notes/${created.id}`);
    const second = await request(app).delete(`/notes/${created.id}`);

    expect(second.statusCode).toBe(404);
  });

  it('returns 400 when the id is invalid', async () => {
    const res = await request(app).delete('/notes/abc');

    expect(res.statusCode).toBe(400);
  });
});
