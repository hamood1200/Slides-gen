#!/usr/bin/env node
// Full-size PNG of one slide, for close checks:
//   node tools/shot.mjs <slug> <lang> <n> [out.png]       (decks inside this repo)
//   node tools/shot.mjs <path/to/deck-ar.html> <n> [out.png]   (any deck, e.g. ./my-topic/out/my-topic-ar.html)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const a = process.argv.slice(2);
const byPath = /\.html$/.test(a[0] || '');
const [n, out] = byPath ? a.slice(1) : a.slice(2);
if (!n) { console.error('usage: node tools/shot.mjs <slug> <lang> <n> [out.png]  |  node tools/shot.mjs <deck.html> <n> [out.png]'); process.exit(1); }
const html = byPath ? resolve(a[0]) : fileURLToPath(new URL(`../out/${a[0]}/${a[0]}-${a[1]}.html`, import.meta.url));
const png = out || html.replace(/\.html$/, `-${n}.png`);
const prof = mkdtempSync(join(tmpdir(), 'slides-chrome-'));
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!CHROME) { console.error('Google Chrome not found; set CHROME=/path/to/chrome'); process.exit(1); }
execFileSync(CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${prof}`, '--allow-file-access-from-files',
   '--virtual-time-budget=20000', '--window-size=1920,1080', `--screenshot=${png}`, pathToFileURL(html).href + '#slide=' + n], { stdio: 'ignore' });
rmSync(prof, { recursive: true, force: true });
console.log(png);
