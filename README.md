To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

## API e2e checks

Run endpoint checks from terminal (similar to a Postman collection flow):

1. Start the server:
```sh
bun run dev
```
2. In another terminal, run:
```sh
bun run test:e2e
```

Notes:
- Tests use `api-collection/environments/local.yml` values.
- Tests fail fast when the server is not reachable.
- The flow signs up, signs in, verifies `/session`, then issues a cleanup `DELETE` so the same test user/email can be reused.

## Configuration

Environment variables are validated at startup with a schema-backed config module.
Invalid values fail fast with readable error messages.

Supported variables:
- `APP_NAME` (default: `be-baseplate`)
- `APP_ENV` (default: `development`; allowed: `local`, `development`, `staging`, `production`, `test`)
- `APP_PORT` (default: `3000`; valid range: `1-65535`)
