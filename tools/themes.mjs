#!/usr/bin/env node
// The design picker: draws the same short deck in all ten designs and lays them out on one sheet, numbered.
//   node tools/themes.mjs [--lang ar|en] [--title "the user's deck title"] [--out <dir>] [--only <id,id>]
// Writes <out>/themes-<lang>.png (all ten, 2 across) and <out>/theme-<n>-<id>-<lang>.png (one each).
// Default out: out/themes/. Needs Google Chrome and internet (fonts), like build.mjs.
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const lang = opt('--lang') || 'ar';
const out = resolve(opt('--out') || join(ROOT, 'out/themes'));
mkdirSync(out, { recursive: true });
const { themes } = JSON.parse(readFileSync(join(ROOT, 'theme/themes.json'), 'utf8'));
const only = opt('--only')?.split(',');
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
if (!CHROME) { console.error('Google Chrome not found; set CHROME=/path/to/chrome'); process.exit(1); }

// the sample deck, with the user's title on the cover when given
const tmp = mkdtempSync(join(tmpdir(), 'slides-themes-'));
const deck = JSON.parse(readFileSync(join(ROOT, 'theme/sample/deck.json'), 'utf8'));
if (opt('--title')) deck.cover.title = { ...deck.cover.title, [lang]: opt('--title') };
if (opt('--subtitle')) deck.cover.subtitle = { ...deck.cover.subtitle, [lang]: opt('--subtitle') };
writeFileSync(join(tmp, 'deck.json'), JSON.stringify(deck));

const shot = (png, url, w, h) => {
  const prof = mkdtempSync(join(tmpdir(), 'slides-chrome-'));
  try {
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files',
      `--user-data-dir=${prof}`, '--virtual-time-budget=20000', `--window-size=${w},${h}`, `--screenshot=${png}`, url], { stdio: 'ignore' });
  } finally { rmSync(prof, { recursive: true, force: true }); }
};

const tiles = [];
themes.forEach((th, k) => {
  if (only && !only.includes(th.id)) return;
  const dir = join(tmp, th.id);
  execFileSync('node', [join(ROOT, 'build.mjs'), tmp, '--lang', lang, '--theme', th.id, '--out', dir, '--no-pdf', '--no-sheet'], { stdio: 'ignore' });
  const png = join(out, `theme-${k + 1}-${th.id}-${lang}.png`);
  // cover, a bullets slide with a photo, the formula slide, a section divider
  shot(png, pathToFileURL(join(dir, `theme-sample-${lang}.html`)).href + '#pick=1,4,5,3', 1200, 696);
  tiles.push({ n: k + 1, th, png });
  console.log(`${k + 1}. ${th.id}  ${png}`);
});

// the contact sheet: number, name and a line about each design over its tile
const ar = lang === 'ar';
const html = `<!doctype html><html lang="${lang}" dir="${ar ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@500;700&family=IBM+Plex+Sans:wght@500;700&family=IBM+Plex+Mono:wght@600&display=swap">
<style>*{margin:0;box-sizing:border-box}body{background:#1d1f24;padding:40px;font-family:"IBM Plex Sans","IBM Plex Sans Arabic",sans-serif;color:#fff;width:2520px}
h1{font-size:44px;margin:0 0 30px}.g{display:grid;grid-template-columns:repeat(2,1200px);gap:44px 40px}
.t header{display:flex;align-items:baseline;gap:18px;margin-bottom:12px}.t b{font:600 40px "IBM Plex Mono",monospace;color:#f2c230}
.t span{font-size:30px;font-weight:700}.t em{font-style:normal;font-size:21px;color:#aab0bb}.t img{display:block;width:1200px}</style></head><body>
<h1>${ar ? 'اختار رقم التصميم' : 'Pick a design by number'}</h1><div class="g">
${tiles.map(x => `<div class="t"><header><b>${x.n}</b><span>${x.th.name[lang]}</span><em>${x.th.about[lang]}</em></header><img src="${pathToFileURL(x.png).href}"></div>`).join('')}
</div></body></html>`;
writeFileSync(join(tmp, 'sheet.html'), html);
const rows = Math.ceil(tiles.length / 2);
shot(join(out, `themes-${lang}.png`), pathToFileURL(join(tmp, 'sheet.html')).href, 2520, 140 + rows * 806);
rmSync(tmp, { recursive: true, force: true });
console.log(join(out, `themes-${lang}.png`));
