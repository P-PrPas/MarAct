import { spawnSync } from 'node:child_process';
import { ideaIds } from './idea-ids.mjs';

const id = process.argv[2];
if (!ideaIds.includes(id)) {
  console.error(`Choose IDEA from: ${ideaIds.join(', ')}`);
  process.exit(1);
}

const commands = [
  ['--import', 'tsx', '--test', `backend/src/modules/${id}/**/*.test.ts`],
  ['node_modules/@playwright/test/cli.js', 'test', `frontend/src/ideas/${id}/`],
];
for (const args of commands) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
