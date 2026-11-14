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
| GET | /metrics | Prometheus metrics endpoint (RED method) | 200 |
| POST | /notes | Create a note | 201 |
| GET | /notes | List notes, newest first (max 100) | 200 |
| GET | /notes/:id | Read one note | 200 |
| PUT | /notes/:id | Replace title and body | 200 |
| DELETE | /notes/:id | Delete a note | 204 |

Errors are returned as JSON, for example `{"error":"Note not found"}`. Invalid input returns 400, a missing note returns 404, and a database outage returns 503.

## Container security

The API container runs as an unprivileged user with a read-only filesystem, no extra Linux capabilities and `no-new-privileges`. Package managers are removed from the runtime image, and no secret is ever baked into the image: settings are injected at run time from `.env`.

## Monitoring storage and metric labels

Grafana stores its database (including accounts and UI settings) in the
`grafana_data` named volume mounted at `/var/lib/grafana`. Prometheus stores
its time-series database in `prometheus_data` mounted at `/prometheus`.
Dashboard and datasource provisioning files remain version-controlled.

Named volumes survive container recreation and `docker compose down`.
`docker compose down -v` deletes these volumes **and the PostgreSQL volume**.
Volumes are persistent storage, not backups.

Before adding these mounts to an existing installation, stop Grafana and
Prometheus and back up `/var/lib/grafana` and `/prometheus` from their existing
containers. New named volumes start empty; adding them does not migrate the
old data automatically. Restore the backups into the new volumes with the
correct container-user ownership before restarting if retaining history and
accounts is required. Keep backups outside Git: they can contain credentials.

Unknown HTTP paths share the fixed metric route label `unmatched`; matched
routes use Express route templates rather than individual note IDs. This
prevents arbitrary URLs from creating an unbounded number of route labels.

Run the focused regression tests with:

```bash
npm test -- --runTestsByPath test/metrics.test.js
```

## Roadmap

- [x] Repository foundation (Git, pull requests, protected `main` branch)
- [x] Application and automated tests
- [x] Containerization with Docker
- [x] Continuous integration pipeline
- [x] Security gates (secret scanning, dependency scanning, container scanning, SAST, IaC scanning)
- [x] Infrastructure as code (Kubernetes manifests with Zero-Trust network and CIS hardening)
- [x] Monitoring and operations (Prometheus metrics & RED method)

## Contributing

All changes are made through pull requests. Pull request titles follow the [Conventional Commits](https://www.conventionalcommits.org/) format, for example `feat: add note creation endpoint`.

## Security

Please see [SECURITY.md](SECURITY.md) for how to report a vulnerability.
