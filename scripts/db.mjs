import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';

const [command, idea] = process.argv.slice(2);
const database = new URL('../backend/db/', import.meta.url);
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL before running database commands.');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

async function applyMigrations() {
  const directory = new URL('migrations/', database);
  const files = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock(428910)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY)');
    const result = await client.query('SELECT filename FROM schema_migrations');
    const applied = new Set(result.rows.map(({ filename }) => filename));
    for (const filename of files) {
      if (applied.has(filename)) continue;
      await client.query(await readFile(new URL(filename, directory), 'utf8'));
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      console.log(`Applied ${filename}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function seed() {
  const directory = new URL('seeds/', database);
  const entries = await readdir(directory, { withFileTypes: true });
  const ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  if (idea !== '--all' && !ids.includes(idea)) throw new Error('Pass a seed directory ID or --all.');
  for (const id of idea === '--all' ? ids : [idea]) {
    const target = new URL(`${id}/`, directory);
    const files = (await readdir(target)).filter((name) => name.endsWith('.sql')).sort();
    await client.query('BEGIN');
    try {
      for (const filename of files) {
        await client.query(await readFile(new URL(filename, target), 'utf8'));
      }
      await client.query('COMMIT');
      console.log(`Loaded ${id} fixtures`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
}

try {
  if (command === 'migrate') await applyMigrations();
  else if (command === 'seed') await seed();
  else throw new Error('Expected migrate or seed.');
} finally {
  await client.end();
}
