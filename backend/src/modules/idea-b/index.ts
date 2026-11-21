import type { Pool } from 'pg';
import { recordsRouter } from '../../shared/records.js';

export function ideaBRouter(pool: Pool) {
  return recordsRouter(pool, {
    list: 'SELECT id, title FROM idea_b_records ORDER BY id',
    insert: 'INSERT INTO idea_b_records (title) VALUES ($1) RETURNING id, title',
  });
}
