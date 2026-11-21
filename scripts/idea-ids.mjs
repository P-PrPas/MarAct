import { readdirSync } from 'node:fs';
import { URL } from 'node:url';

export const ideaIds = readdirSync(new URL('../backend/src/modules/', import.meta.url), {
  withFileTypes: true,
}).filter((entry) => entry.isDirectory() && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(entry.name))
  .map((entry) => entry.name.replaceAll('_', '-')).sort();
