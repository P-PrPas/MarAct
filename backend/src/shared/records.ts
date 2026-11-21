import { Router } from 'express';
import type { Pool } from 'pg';

export function recordsRouter(pool: Pool, queries: { list: string; insert: string }) {
  const router = Router();

  router.get('/records', async (_req, res) => {
    const result = await pool.query(queries.list);
    res.json(result.rows);
  });

  router.post('/records', async (req, res) => {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (!title || title.length > 120 || title.includes('\0')) {
      res.status(400).json({ error: 'Enter a valid title of 1–120 characters.' });
      return;
    }
    const result = await pool.query(queries.insert, [title]);
    res.status(201).json(result.rows[0]);
  });

  return router;
}
