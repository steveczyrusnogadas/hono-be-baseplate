import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { config } from './src/config';

export default defineConfig({
  out: './src/database/migrations',
  schema: './src/database/schema/*.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.database.url,
  },
});
