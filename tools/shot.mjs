#!/usr/bin/env node
// Full-size PNG of one slide, for close checks:  node tools/shot.mjs <slug> <lang> <n> [out.png]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const [slug, lang, n, out] = process.argv.slice(2);
if (!n) { console.error('usage: node tools/shot.mjs <slug> <lang> <slide number> [out.png]'); process.exit(1); }
const html = fileURLToPath(new URL(`../out/${slug}/${slug}-${lang}.html`, import.meta.url));
const png = out || html.replace(/\.html$/, `-${n}.png`);
const prof = mkdtempSync(join(tmpdir(), 'slides-chrome-'));
execFileSync(process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${prof}`, '--allow-file-access-from-files',
   '--virtual-time-budget=20000', '--window-size=1920,1080', `--screenshot=${png}`, pathToFileURL(html).href + '#slide=' + n], { stdio: 'ignore' });
rmSync(prof, { recursive: true, force: true });
console.log(png);
