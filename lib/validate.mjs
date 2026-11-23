// Checks a deck before it is drawn. Errors stop the build; warnings are printed and the build goes on.
import { L, MissingText } from './text.mjs';

export const MAX_SLIDES = 25;

const TYPES = ['section', 'bullets', 'compare', 'steps', 'stats', 'formula', 'table', 'image', 'takeaway'];
const NEEDS = {
  section: ['title'], bullets: ['title', 'points'], compare: ['title', 'columns'], steps: ['title', 'steps'],
  stats: ['title', 'stats'], formula: ['title', 'formula'], table: ['title', 'rows'], image: ['title', 'image'], takeaway: ['text'],
};

export function validate(deck, plan, langs) {
  const errors = [], warnings = [];
  if (!deck.cover?.title) errors.push('cover.title is missing');
  if (!Array.isArray(deck.slides) || !deck.slides.length) errors.push('deck.slides is empty');

  (deck.slides || []).forEach((s, k) => {
    const w = `slides[${k}]`;
    if (!TYPES.includes(s.type)) errors.push(`${w}: unknown type "${s.type}" (use one of ${TYPES.join(', ')})`);
    for (const f of NEEDS[s.type] || []) if (s[f] == null) errors.push(`${w} (${s.type}): "${f}" is missing`);
    if (s.type === 'compare' && s.columns?.length !== 2) errors.push(`${w}: compare needs exactly 2 columns`);
    if (s.type === 'steps' && s.steps && (s.steps.length < 2 || s.steps.length > 5)) warnings.push(`${w}: steps work best with 3 to 5 items (has ${s.steps.length})`);
    if (s.type === 'stats' && s.stats && (s.stats.length < 2 || s.stats.length > 4)) warnings.push(`${w}: stats need 2 to 4 numbers (has ${s.stats.length})`);
    if (s.type === 'table' && s.rows && s.rows.length > 8) warnings.push(`${w}: table has ${s.rows.length - 1} rows; more than 7 gets hard to read on a slide`);
  });

  if (plan.length > MAX_SLIDES) errors.push(`${plan.length} slides in total (cover, remembrance, presenter, agenda, offer and closing included); the limit is ${MAX_SLIDES}`);

  for (const lang of langs) {
    try { L(deck.cover, lang, 'cover'); } catch (e) { if (e instanceof MissingText) errors.push(e.message); else throw e; }
    (deck.slides || []).forEach((s, k) => {
      let x;
      try { x = L(s, lang, `slides[${k}]`); } catch (e) { if (e instanceof MissingText) { errors.push(e.message); return; } throw e; }
      const w = `slides[${k}] ${lang}`;
      if (x.title && x.title.length > 70) warnings.push(`${w}: title is ${x.title.length} characters; keep it under 70`);
      const pts = x.points || [];
      if (pts.length > 6) warnings.push(`${w}: ${pts.length} points; 6 is the most a slide holds comfortably`);
      for (const p of pts) {
        const t = typeof p === 'string' ? p : p.text || '';
        if (t.length > 120) warnings.push(`${w}: a point runs ${t.length} characters; split it or cut it under 120`);
      }
    });
  }
  return { errors, warnings };
}
