FROM oven/bun:1.3.9-slim

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
