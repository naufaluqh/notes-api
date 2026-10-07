# 0001: Use Node.js and PostgreSQL

## Status

Accepted

## Context

This project is a hands-on DevSecOps learning project. The goal is to learn how to build, secure and operate a pipeline, not to learn a new programming language. We need a small REST API with persistent storage.

## Decision

- Use **Node.js** for the API, because it is already familiar and keeps the focus on the pipeline.
- Use **PostgreSQL** for storage, because it is a widely used relational database in production systems.

## Consequences

- Dependencies are managed with npm, so dependency scanning will focus on the npm ecosystem.
- Container images will be based on a Node.js runtime image.
- The database must be run as a separate service, which introduces networking and secret management concerns that we will cover in later phases.
