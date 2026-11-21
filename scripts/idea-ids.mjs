import { readdirSync } from 'node:fs';

export const ideaIds = readdirSync(new URL('../backend/src/modules/', import.meta.url), {
  withFileTypes: true,
}).filter((entry) => entry.isDirectory() && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name))
  .map((entry) => entry.name).sort();
