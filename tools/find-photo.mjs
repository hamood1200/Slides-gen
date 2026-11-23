// Find a real, openly licensed photo for a slide and save it with its credit.
//
//   node tools/find-photo.mjs "power transformer substation"          list candidates
//   node tools/find-photo.mjs "power transformer substation" --get 3 decks/<slug> transformer
//                                                                    save candidate 3 as decks/<slug>/img/transformer.jpg
//
// Source: Openverse (api.openverse.org), which indexes Wikimedia Commons, Flickr and other open
// collections. No API key. Only licences that allow commercial use are listed (CC0, PDM, BY, BY-SA),
// because the decks promote Najdeah products. Every saved photo gets an entry in
// decks/<slug>/img/credits.json; the renderer prints the credit on the slide. Never remove it:
// BY and BY-SA licences require it.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// Wikimedia answers 429 to a User-Agent without a contact URL (their UA policy).
const UA = 'Slides-gen/1.0 (educational slide builder; https://github.com/)';
const [q, ...rest] = process.argv.slice(2);
if (!q) { console.error('usage: node tools/find-photo.mjs "<search>" [--get <n> decks/<slug> <name>]'); process.exit(1); }
const gi = rest.indexOf('--get');

const api = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&license_type=commercial&page_size=20&mature=false`;
const res = await fetch(api, { headers: { 'User-Agent': UA } });
if (!res.ok) { console.error(`Openverse said ${res.status}. Try again in a minute (anonymous use is rate-limited).`); process.exit(1); }
const list = (await res.json()).results
  .filter(r => (r.width || 0) >= 1000 && ['cc0', 'pdm', 'by', 'by-sa'].includes(r.license))
  .sort((a, b) => (b.width || 0) - (a.width || 0));

if (gi < 0) {
  if (!list.length) console.log('nothing found at 1000px or wider; try other words (English works best)');
  list.forEach((r, k) => console.log(`${String(k + 1).padStart(2)}. ${r.title?.slice(0, 60)}\n    ${r.width}×${r.height} · ${r.license.toUpperCase()} ${r.license_version || ''} · ${r.creator || 'unknown'} · ${r.source}\n    ${r.foreign_landing_url}`));
  process.exit(0);
}

const [n, deckDir, name] = rest.slice(gi + 1);
const r = list[Number(n) - 1];
if (!r || !deckDir || !name) { console.error('need: --get <n> decks/<slug> <name>'); process.exit(1); }
const imgDir = join(deckDir, 'img'); mkdirSync(imgDir, { recursive: true });
// Wikimedia throttles full-size originals; ask for its 1280 px thumbnail instead.
const wm = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(\w\/\w\w)\/([^/]+)$/.exec(r.url);
const src = wm && (r.width || 0) > 1280 ? `${wm[1]}/thumb/${wm[2]}/${wm[3]}/1280px-${wm[3]}` : r.url;
const img = await fetch(src, { headers: { 'User-Agent': UA } });
if (!img.ok) { console.error(`download failed (${img.status}): ${src}`); process.exit(1); }
const type = img.headers.get('content-type') || '';
if (!/^image\/(jpeg|png|webp)/.test(type)) { console.error(`not a photo (${type}); pick another`); process.exit(1); }
const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
const file = join(imgDir, `${name}.${ext}`);
writeFileSync(file, Buffer.from(await img.arrayBuffer()));
// Commons originals can be 15,000 px wide; slides never need more than 2,000. macOS has sips built in.
if (process.platform === 'darwin') { try { execFileSync('sips', ['-Z', '2000', file], { stdio: 'ignore' }); } catch {} }

const credFile = join(imgDir, 'credits.json');
const creds = existsSync(credFile) ? JSON.parse(readFileSync(credFile, 'utf8')) : {};
creds[file] = {
  title: r.title, creator: r.creator || null, license: r.license === 'pdm' ? 'Public domain' : r.license === 'cc0' ? 'CC0 1.0' : `CC ${r.license.toUpperCase()} ${r.license_version || ''}`.trim(),
  license_url: r.license_url, source: r.source, page: r.foreign_landing_url,
};
writeFileSync(credFile, JSON.stringify(creds, null, 2) + '\n');
console.log(`saved ${file}\n  credit: ${creds[file].creator || 'unknown'}, ${creds[file].license}, via ${r.source}`);
console.log(`  use it: "image": "${file}"`);
