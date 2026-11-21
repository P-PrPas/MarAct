import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createPool } from '../shared/db.js';

const port = Number(process.env.API_PORT ?? 3000);
const pool = createPool();
const frontendDir = fileURLToPath(new URL('../../../frontend/dist/', import.meta.url));
const server = createApp(pool, frontendDir).listen(port, '127.0.0.1', () => {
  console.log(`API listening at http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close(() => void pool.end()));
}
