import { existsSync } from 'node:fs';

import { defineConfig } from '@playwright/test';

const envFile = new URL('.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);
const webPort = 5174;
const apiPort = process.env.TEST_API_PORT ?? '3001';

export default defineConfig({
  testMatch: ['frontend/src/ideas/**/*.spec.ts', 'tests/**/*.spec.ts'],
  forbidOnly: Boolean(process.env.CI),
  use: { baseURL: `http://127.0.0.1:${webPort}` },
  webServer: [
    {
      command: 'node --import tsx backend/src/app/server.ts',
      url: `http://127.0.0.1:${apiPort}/api/health`,
      env: { API_PORT: apiPort },
    },
    {
      command: `npm run dev:web -- --port ${webPort}`,
      url: `http://127.0.0.1:${webPort}/`,
      env: { API_PORT: apiPort },
    },
  ],
});
