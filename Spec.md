# Spec.md — Project Specification

## 1. Purpose

Provide a small Hono + Bun API baseplate with Drizzle-backed PostgreSQL persistence and Better Auth session handling.

## 2. Core Functionality

- Serve a JSON health-style root response at `GET /`.
- Handle Better Auth requests under `POST` and `GET /api/auth/*`.
- Expose the current authenticated session at `GET /session`.
- Allow test-user cleanup at `DELETE /testing/users/by-email/:email` for local and test environments.
- Validate environment variables at startup and fail fast on invalid configuration.
- Run database migrations before application startup in containerized deployments.

## 3. Architecture Overview

- Runtime: Bun.
- HTTP framework: Hono.
- Database layer: Drizzle ORM with PostgreSQL.
- Auth: Better Auth with the Drizzle adapter.
- Configuration: `zod` schema in `src/config.ts`.
- Deployment: Dockerfile-based app image for Dokploy; `docker-compose.yml` is local Postgres only.
- Migration tool: `drizzle-kit` via `bun run db:migrate`.

## 4. Input / Output Contracts

| Input                                   | Format                                                        | Source               |
| --------------------------------------- | ------------------------------------------------------------- | -------------------- |
| `APP_NAME`                              | string                                                        | environment          |
| `APP_ENV`                               | enum: `local`, `development`, `staging`, `production`, `test` | environment          |
| `APP_PORT`                              | number                                                        | environment          |
| `DB_HOST`                               | string                                                        | environment          |
| `DB_PORT`                               | number                                                        | environment          |
| `DB_NAME`                               | string                                                        | environment          |
| `DB_USER`                               | string                                                        | environment          |
| `DB_PASSWORD`                           | string                                                        | environment          |
| `DATABASE_URL`                          | string, optional                                              | environment          |
| `CORS_ORIGINS`                          | comma-separated string list                                   | environment          |
| `BETTER_AUTH_SECRET`                    | string                                                        | environment          |
| `BETTER_AUTH_URL`                       | string                                                        | environment          |
| `GET /`                                 | HTTP request                                                  | client               |
| `POST`/`GET /api/auth/*`                | HTTP request                                                  | Better Auth client   |
| `GET /session`                          | HTTP request                                                  | authenticated client |
| `DELETE /testing/users/by-email/:email` | HTTP request                                                  | test tooling         |

| Output              | Format                            | Destination           |
| ------------------- | --------------------------------- | --------------------- |
| root response       | JSON `{ message: string }`        | client                |
| auth routes         | Better Auth HTTP responses        | client                |
| session response    | JSON `{ session, user }` or `401` | client                |
| cleanup response    | `204`, `404`, or `403`            | test tooling / client |
| config parse result | frozen config object              | application runtime   |

## 5. Constraints / Edge Cases

- `DATABASE_URL` overrides the `DB_*` connection fields when present and non-empty.
- `DATABASE_URL` values containing interpolation placeholders like `${...}` are treated as unusable and ignored in favor of the `DB_*` fallback.
- `DELETE /testing/users/by-email/:email` is disabled unless `APP_ENV` is `local`, `development`, or `test`.
- CORS for `/api/auth/*` is configured from `CORS_ORIGINS` and accepts a comma-separated allowlist.
- The Docker entrypoint runs migrations on startup, so the database must be reachable before the app container starts serving traffic.
- `docker-compose.yml` currently defines only the local PostgreSQL service.
- TypeScript compilation must succeed with `tsc --noEmit`.

## 6. File Map

- `src/index.ts` — Hono app definition and route handlers.
- `src/config.ts` — environment parsing and derived database URL logic.
- `src/database/index.ts` — Drizzle database client.
- `src/database/schema/auth.ts` — auth-related PostgreSQL schema.
- `src/lib/auth.ts` — Better Auth initialization.
- `src/database/migrations/` — generated database migrations.
- `package.json` — scripts for dev, start, migration, and tests.
- `Dockerfile` — production app image for Dokploy.
- `docker-entrypoint.sh` — runs migrations and starts the app.
- `docker-compose.yml` — local PostgreSQL service only.
- `tests/e2e/auth.e2e.test.ts` — end-to-end auth flow.
- `api-collection/environments/local.yml` — local endpoint test values.
- `README.md` — human-facing usage and deployment notes.

## 7. Open Questions

- [ ] Should `docker-compose.yml` eventually include an app service, or remain local-database-only?

## 8. Last Updated

2026-03-23 — Cascade
