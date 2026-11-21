import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../app/app.js';
import { createPool } from '../shared/db.js';

export function testRecords(ideaId: string, deleteRecord: string) {
  test(`${ideaId} lists, validates, and creates records`, async (t) => {
    const pool = createPool();
    const title = `API test ${randomUUID()}`;
    const server = createApp(pool).listen(0, '127.0.0.1');
    t.after(async () => {
      try {
        await pool.query(deleteRecord, [title]);
      } finally {
        try {
          await new Promise<void>((resolve) => server.close(() => resolve()));
        } finally {
          await pool.end();
        }
      }
    });
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const endpoint = `http://127.0.0.1:${address.port}/api/ideas/${ideaId}/records`;

    const initial = await fetch(endpoint);
    assert.equal(initial.status, 200);
    assert.ok(Array.isArray(await initial.json()));
    const post = (title: string) => fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    const invalid = await post(' ');
    assert.equal(invalid.status, 400);
    await invalid.json();
    const created = await post(` ${title} `);
    assert.equal(created.status, 201);
    const item = await created.json();
    assert.equal(item.title, title);
    const records = await (await fetch(endpoint)).json();
    assert.ok(records.some((record: { id: number }) => record.id === item.id));
  });
}
