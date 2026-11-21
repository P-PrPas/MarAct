import { spawnSync } from 'node:child_process';
import { ideaIds } from './idea-ids.mjs';

const id = process.argv[2];
if (!ideaIds.includes(id)) {
  console.error(`Choose IDEA from: ${ideaIds.join(', ')}`);
  process.exit(1);
}

const commands = [
  ['uv', 'run', '--locked', 'python', '-m', 'pytest', `backend/src/modules/${id.replaceAll('-', '_')}`],
  [process.execPath, 'node_modules/@playwright/test/cli.js', 'test', `frontend/src/ideas/${id}/`],
];
for (const [command, ...args] of commands) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
