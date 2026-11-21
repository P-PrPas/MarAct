import express from 'express';
import type { ErrorRequestHandler } from 'express';
import type { Pool } from 'pg';
import { ideaARouter } from '../modules/idea-a/index.js';
import { ideaBRouter } from '../modules/idea-b/index.js';

export function createApp(pool: Pool, frontendDir?: string) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/ideas/idea-a', ideaARouter(pool));
  app.use('/api/ideas/idea-b', ideaBRouter(pool));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

  if (frontendDir) {
    app.use(express.static(frontendDir));
    app.get(['/', '/ideas', '/ideas/{*path}'], (_req, res) => {
      res.sendFile('index.html', { root: frontendDir });
    });
  }

  const handleError: ErrorRequestHandler = (error, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const status = error.status ?? 500;
    if (status >= 500) console.error(error);
    res.status(status).json({ error: status >= 500 ? 'Server error.' : 'Invalid request.' });
  };
  app.use(handleError);
  return app;
}
