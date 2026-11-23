#!/usr/bin/env node
// node build.mjs decks/<slug> [--lang ar|en|both] [--no-pdf] [--no-sheet]
// Writes out/<slug>/<slug>-<lang>.html, .pdf and -sheet.png. No npm packages; needs Google Chrome.
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { renderDeck } from './lib/render.mjs';
import { validate, MAX_SLIDES } from './lib/validate.mjs';
import { loadCatalogue, pickOffer, offerUrl } from './lib/offers.mjs';
import { L } from './lib/text.mjs';

const ROOT = new URL('./', import.meta.url);
const args = process.argv.slice(2);
const deckDir = args.find(a => !a.startsWith('--'));
if (!deckDir) { console.error('usage: node build.mjs decks/<slug> [--lang ar|en|both] [--no-pdf] [--no-sheet]'); process.exit(1); }
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

const deckPath = resolve(deckDir, deckDir.endsWith('.json') ? '' : 'deck.json');
const deck = JSON.parse(readFileSync(deckPath, 'utf8'));
const slug = deck.slug || basename(resolve(deckDir));
const want = opt('--lang') || (deck.languages?.length > 1 ? 'both' : deck.languages?.[0]) || 'both';
const langs = want === 'both' ? ['ar', 'en'] : [want];

const brand = JSON.parse(readFileSync(new URL('brand/brand.json', ROOT), 'utf8'));
const cat = loadCatalogue(ROOT);

// ---------- plan: the full slide order ----------
const pick = pickOffer(deck, cat);
const plan = [{ type: 'cover', _w: 'cover' }];
if (deck.presenter !== false) plan.push({ type: 'presenter', _w: 'presenter' });
const body = deck.slides.map((s, k) => ({ ...s, _w: `slides[${k}]` }));
let n = 0;
for (const s of body) if (s.type === 'section') s._n = ++n;
const sections = body.filter(s => s.type === 'section');
if (deck.agenda !== false && sections.length >= 2) plan.push({ type: 'agenda', _w: 'agenda', items: sections.map(s => s.title) });

// the offer goes before the section that starts closest to the middle, or after deck.offer_after (1-based in deck.slides)
let at = null;
if (pick.offer) {
  if (Number.isInteger(deck.offer_after)) at = Math.min(Math.max(deck.offer_after, 1), body.length);
  else {
    const mid = body.length / 2;
    const cands = body.map((s, k) => k).filter(k => k > 0 && body[k].type === 'section');
    at = cands.length ? cands.reduce((a, b) => Math.abs(b - mid) < Math.abs(a - mid) ? b : a) : Math.round(mid);
  }
}
body.forEach((s, k) => {
  if (k === at) plan.push({ type: 'offer', _w: 'offer', offer: pick.offer, url: offerUrl(pick.offer, slug, cat) });
  plan.push(s);
});
if (at === body.length) plan.push({ type: 'offer', _w: 'offer', offer: pick.offer, url: offerUrl(pick.offer, slug, cat) });
plan.push({ type: 'closing', _w: 'closing', title: deck.closing?.title });

// ---------- checks ----------
const { errors, warnings } = validate(deck, plan, langs);
if (pick.offer) for (const lang of langs) {
  try { L(pick.offer, lang, `offer ${pick.offer.id}`); } catch (e) { errors.push(e.message); }
}
for (const w of warnings) console.warn('  warn  ' + w);
if (errors.length) { for (const e of errors) console.error('  ERROR ' + e); process.exit(1); }

console.log(`${slug}: ${plan.length}/${MAX_SLIDES} slides, ${sections.length} sections`);
console.log(`  offer: ${pick.offer ? pick.offer.id : 'none'} (${pick.reason})`);
if (pick.ranked) console.log('  ranked: ' + pick.ranked.slice(0, 4).map(r => `${r.offer.id} ${r.score}`).join(' · '));

// ---------- render ----------
const outDir = new URL(`out/${slug}/`, ROOT);
mkdirSync(outDir, { recursive: true });
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
const chrome = (extra, url) => {
  const prof = mkdtempSync(join(tmpdir(), 'slides-chrome-'));
  try {
    return execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--allow-file-access-from-files',
      `--user-data-dir=${prof}`, '--virtual-time-budget=20000', ...extra, url], { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
  } finally { rmSync(prof, { recursive: true, force: true }); }
};

let bad = 0;
for (const lang of langs) {
  const html = renderDeck(deck, plan, lang, { brand });
  const file = new URL(`${slug}-${lang}.html`, outDir);
  writeFileSync(file, html);
  const url = pathToFileURL(fileURLToPath(file)).href;
  console.log(`  ${lang}: out/${slug}/${slug}-${lang}.html`);
  if (!CHROME) { console.warn('  Chrome not found; set CHROME=/path/to/chrome for PDF and checks'); continue; }

  const dom = chrome(['--dump-dom'], url);
  if (!dom.includes('data-checked="1"')) console.warn('  warn  layout check did not finish (fonts slow?); look at the sheet by eye');
  for (const m of dom.matchAll(/data-i="(\d+)" data-type="(\w+)"[^>]*?data-overflow="([^"]*)"/g)) {
    bad++; console.error(`  OVERFLOW ${lang} slide ${m[1]} (${m[2]}): ${m[3]}`);
  }
  if (!flag('--no-sheet')) {
    const rows = Math.ceil(plan.length / 4);
    chrome([`--screenshot=${fileURLToPath(new URL(`${slug}-${lang}-sheet.png`, outDir))}`, `--window-size=1984,${rows * 286 + 16}`], url + '#sheet');
    console.log(`  ${lang}: out/${slug}/${slug}-${lang}-sheet.png`);
  }
  if (!flag('--no-pdf')) {
    chrome([`--print-to-pdf=${fileURLToPath(new URL(`${slug}-${lang}.pdf`, outDir))}`, '--no-pdf-header-footer'], url);
    console.log(`  ${lang}: out/${slug}/${slug}-${lang}.pdf`);
  }
}
if (bad) { console.error(`\n${bad} slide(s) overflow. Shorten the text or split the slide, then build again.`); process.exit(2); }
