#!/usr/bin/env node
// Pulls the latest humanizer skill from github.com/blader/humanizer into skills/humanizer/.
// Needs git. Run it now and then; the writing rules in CLAUDE.md point at skills/humanizer/SKILL.md.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, cpSync, rmSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const dest = fileURLToPath(new URL('../skills/humanizer/', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'humanizer-'));
try {
  execFileSync('git', ['clone', '--depth', '1', 'https://github.com/blader/humanizer.git', tmp], { stdio: 'ignore' });
  const sha = execFileSync('git', ['-C', tmp, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  for (const f of readdirSync(tmp)) if (!f.startsWith('.')) cpSync(join(tmp, f), join(dest, f), { recursive: true });
  writeFileSync(join(dest, 'SOURCE.md'), `Vendored ${new Date().toISOString().slice(0, 10)} at commit ${sha} from https://github.com/blader/humanizer\nRefresh: node tools/sync-humanizer.mjs\n`);
  console.log(`skills/humanizer updated to ${sha}`);
} finally { rmSync(tmp, { recursive: true, force: true }); }
