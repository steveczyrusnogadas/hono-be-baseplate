To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

## Configuration

Environment variables are validated at startup with a schema-backed config module.
Invalid values fail fast with readable error messages.

Supported variables:
- `APP_NAME` (default: `be-baseplate`)
- `APP_ENV` (default: `development`; allowed: `local`, `development`, `staging`, `production`, `test`)
- `APP_PORT` (default: `3000`; valid range: `1-65535`)
