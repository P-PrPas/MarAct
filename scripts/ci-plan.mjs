import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { ideaIds } from './idea-ids.mjs';

const [base, head] = process.argv.slice(2);
let full = !base;
const affected = new Set();
if (base) {
  const paths = execFileSync('git', ['diff', '--no-renames', '--name-only', '-z', `${base}...${head}`],
    { encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const path of paths) {
    const id = /^(?:frontend\/src\/ideas|backend\/src\/modules|backend\/db\/seeds)\/([^/]+)\//.exec(path)?.[1];
    if (ideaIds.includes(id)) affected.add(id);
    else full = true;
  }
}
const selected = full ? ideaIds : [...affected].sort();
const output = `ideas=${JSON.stringify(selected)}\nfull=${full}\n`;
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
else console.log(output);
