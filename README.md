# Notes API

A REST API for creating, reading, updating and deleting notes.

This project is also a hands-on **DevSecOps** learning project: every change goes through a pull request, and security checks are added to the pipeline step by step.

## Tech stack

- Node.js and Express
- PostgreSQL 16
- Docker and Docker Compose
- Jest and Supertest for automated tests
- GitHub Actions (planned)

## Getting started

Requirements: Docker with Docker Compose. Node.js 22 or newer is only needed to run the tests.

### Run everything with Docker Compose

1. Clone the repository:

```bash
   git clone https://github.com/naufaluqh/notes-api.git
   cd notes-api
```

2. Create your local settings file and set a strong password:

```bash
   cp .env.example .env
   openssl rand -hex 16
```

   Put the generated value in `POSTGRES_PASSWORD` inside `.env`. The `.env` file is ignored by Git and must never be committed.

3. Start the database and the API, then wait until both are healthy:

```bash
   docker compose up -d --build
   docker compose ps
```

4. Create the tables and check that the API is ready:

```bash
   docker compose exec api node db/migrate.js
   curl http://localhost:3000/ready
```

The API listens on http://localhost:3000. Stop everything with `docker compose down` (data is kept in a Docker volume). Add `-v` to delete the data as well.

### Run the tests

```bash
npm ci
docker compose exec db psql -U notes_app -d notes -c "CREATE DATABASE notes_test;"
npm test
```

## API

| Method | Path | Description | Success |
|---|---|---|---|
| GET | /health | Liveness check | 200 |
| GET | /ready | Readiness check (includes the database) | 200, or 503 |
| POST | /notes | Create a note | 201 |
| GET | /notes | List notes, newest first (max 100) | 200 |
| GET | /notes/:id | Read one note | 200 |
| PUT | /notes/:id | Replace title and body | 200 |
| DELETE | /notes/:id | Delete a note | 204 |

Errors are returned as JSON, for example `{"error":"Note not found"}`. Invalid input returns 400, a missing note returns 404, and a database outage returns 503.

## Container security

The API container runs as an unprivileged user with a read-only filesystem, no extra Linux capabilities and `no-new-privileges`. Package managers are removed from the runtime image, and no secret is ever baked into the image: settings are injected at run time from `.env`.

## Roadmap

- [x] Repository foundation (Git, pull requests, protected `main` branch)
- [x] Application and automated tests
- [x] Containerization with Docker
- [ ] Continuous integration pipeline
- [ ] Security gates (secret scanning, dependency scanning, container scanning, SAST)
- [ ] Infrastructure as code and deployment
- [ ] Monitoring and operations

## Contributing

All changes are made through pull requests. Pull request titles follow the [Conventional Commits](https://www.conventionalcommits.org/) format, for example `feat: add note creation endpoint`.

## Security

Please see [SECURITY.md](SECURITY.md) for how to report a vulnerability.
