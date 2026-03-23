#!/bin/sh
set -e

export APP_PORT="${APP_PORT:-${PORT:-3000}}"

bun run db:migrate
exec bun run start
