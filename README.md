# be-baseplate

Hono + Bun + Drizzle + Better Auth API baseplate.

## Install

```sh
bun install
```

## Run locally

```sh
bun run dev
```

Open http://localhost:3000.

## API endpoints

- `GET /` returns a JSON hello response.
- `POST` and `GET /api/auth/*` are handled by Better Auth.
- `GET /session` returns the current session and user when authenticated.
- `DELETE /testing/users/by-email/:email` removes a test user in `local`, `development`, or `test` mode.

## API e2e checks

The endpoint flow in `tests/e2e/auth.e2e.test.ts` uses `api-collection/environments/local.yml`.

1. Start the server on port `3001`:

```sh
APP_PORT=3001 bun run dev
```

2. In another terminal, run:

```sh
bun run test:e2e
```

Notes:

- The test flow signs up, signs in, verifies `/session`, then issues a cleanup `DELETE`.
- The e2e collection expects the API at `http://localhost:3001`.

## Configuration

Environment variables are validated at startup with a schema-backed config module.
Invalid values fail fast with readable error messages.

Supported variables:

- `APP_NAME` (default: `be-baseplate`)
- `APP_ENV` (default: `development`; allowed: `local`, `development`, `staging`, `production`, `test`)
- `APP_PORT` (default: `3000`; valid range: `1-65535`)
- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `5432`)
- `DB_NAME` (default: `be_baseplate`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `DATABASE_URL` (optional; overrides the `DB_*` fields when set)
- `CORS_ORIGINS` (optional; comma-separated list of allowed browser origins for `/api/auth/*`)
- `BETTER_AUTH_SECRET` (required by Better Auth)
- `BETTER_AUTH_URL` (required by Better Auth)

## Database

The app uses Drizzle migrations from `src/database/migrations`.

To apply migrations manually:

```sh
bun run db:migrate
```

## Local Postgres

`docker-compose.yml` defines only the Postgres service for local development.

Start it with:

```sh
docker compose up -d
```

## Dokploy deployment

Use the repository `Dockerfile` for the app container in Dokploy.
The `docker-compose.yml` file is for local Postgres only and does not define the app container.

At runtime, the container runs `bun run db:migrate` before starting the server.
Set `DATABASE_URL` in Dokploy so both the app and migration command target the same database.
Set `CORS_ORIGINS` to every browser origin that should be allowed to call `/api/auth/*`.
Postman does not enforce browser CORS rules, so it can call the API directly as long as the service is reachable.
