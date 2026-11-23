// Language picking + inline markup. Every text field in a deck may be:
//   "plain string"                (same in every language)
//   { "en": "...", "ar": "..." }  (per language)
// Arrays may be [ ...fields ] or { "en": [...], "ar": [...] }.

export class MissingText extends Error {}

export function L(v, lang, where = '') {
  if (v == null) return v;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map((x, i) => L(x, lang, `${where}[${i}]`));
  if (typeof v === 'object' && ('en' in v || 'ar' in v)) {
    if (v[lang] == null) throw new MissingText(`missing "${lang}" text at ${where}`);
    return L(v[lang], lang, where);
  }
  // a plain object (e.g. a point with text + sub): localise each field
  const o = {};
  for (const k of Object.keys(v)) o[k] = L(v[k], lang, `${where}.${k}`);
  return o;
}

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Latin runs inside Arabic text (MPPT, 1.25, kW, IEC 61215) are isolated LTR in Fira Sans,
// so numbers render (the Madani demo has no digits) and bidi never scrambles them.
const LATIN = /([A-Za-z0-9(+−√](?:[A-Za-z0-9 ,:/%°+\-–−×=≈√_²³'()&γ]|\.(?! ))*[A-Za-z0-9)%°²³]|[A-Za-z0-9])/g;
// For places with no HTML (SVG text): isolate Latin runs with Unicode LRI…PDI marks.
export const isolateLatin = raw => String(raw).replace(LATIN, m => `\u2066${m}\u2069`);
function wrapLatin(raw) {
  let out = '', last = 0;
  raw.replace(LATIN, (m, _g, off) => {
    out += esc(raw.slice(last, off)) + `<span class="en">${esc(m)}</span>`;
    last = off + m.length;
  });
  return out + esc(raw.slice(last));
}

// LaTeX: KaTeX renders every .tex span in the browser (see render.mjs). display=true for a block equation.
export const tex = (src, display = false) => `<span class="tex${display ? ' d' : ''}" dir="ltr" data-tex="${esc(src)}">${esc(src)}</span>`;

// **bold**  `english term`  $latex$  — nothing else. Slides stay plain.
export function md(s, lang) {
  if (s == null) return '';
  const plain = t => (lang === 'ar' ? wrapLatin(t) : esc(t));
  return String(s).split(/(\$[^$]+\$|\*\*[^*]+\*\*|`[^`]+`)/).map(p => {
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) return tex(p.slice(1, -1));
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return `<b>${plain(p.slice(2, -2))}</b>`;
    if (p.startsWith('`') && p.endsWith('`') && p.length > 2) return `<span class="en">${esc(p.slice(1, -1))}</span>`;
    return plain(p);
  }).join('');
}

// Arabic normalisation for keyword matching
export function norm(s) {
  return String(s).toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')   // diacritics, tatweel
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

// every string in a value, both languages — used for offer matching and length checks
// keys that hold paths or settings, never reader-facing text
const NOT_TEXT = new Set(['type', 'image', 'photo', 'palette', 'slug', 'offer', 'offer_after', 'discipline', 'languages', 'layout', 'fit', 'columns', 'presenter', 'agenda']);
export function allStrings(v, out = []) {
  if (v == null) return out;
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => allStrings(x, out));
  else if (typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!NOT_TEXT.has(k)) allStrings(x, out);
  return out;
}
