// Picks the mid-deck offer. Works for any engineering field:
// 1. deck.offer = "<id>"  → that offer, no questions.
// 2. deck.offer = "none"  → no offer slide.
// 3. deck.offer = "auto"  → score every offer whose disciplines include the deck's discipline (or "any")
//    by keyword hits across the whole deck (titles count ×3). Best score ≥ min_score wins.
//    Otherwise fall back to catalogue.fallback[discipline] or catalogue.fallback.default.
import { readFileSync } from 'node:fs';
import { norm, allStrings } from './text.mjs';

export function loadCatalogue(root) {
  return JSON.parse(readFileSync(new URL('offers/catalogue.json', root), 'utf8'));
}

function count(hay, kw) {
  const k = norm(kw);
  if (/^[a-z0-9 .\/&+-]+$/.test(k)) {
    const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?=$|[^a-z0-9])`, 'g');
    return (hay.match(re) || []).length;
  }
  // Arabic: whole words only, with the usual attached prefixes (ال، و، ب، ل، ف، ك).
  // No suffixes, so "لوح" (a PV panel) never matches "لوحات" (switchgear panels): list plurals as their own keywords.
  const A = '\u0600-\u06FF';
  const re = new RegExp(`(^|[^${A}])(?:وال|بال|فال|كال|لل|ال|و|ب|ل|ف)?${k.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?=$|[^${A}])`, 'g');
  return (hay.match(re) || []).length;
}

export function scoreOffers(deck, cat) {
  const titles = norm(allStrings([deck.cover?.title, deck.cover?.subtitle, ...(deck.slides || []).map(s => s.title)]).join(' \n '));
  const body = norm(allStrings(deck).join(' \n '));
  const disc = (deck.discipline || 'general').toLowerCase();
  return cat.offers
    .filter(o => o.disciplines.includes('any') || o.disciplines.includes(disc))
    .map(o => {
      const matched = [];
      let score = 0;
      const seen = new Set();
      for (const kw of o.keywords) {
        if (seen.has(norm(kw))) continue;          // "ألواح" and "الواح" are the same word after normalising
        seen.add(norm(kw));
        const t = count(titles, kw), b = count(body, kw);
        if (b) { score += b + 2 * t; matched.push(`${kw}×${b}`); }
      }
      if (o.disciplines.includes('any')) score *= 0.5;   // the catch-all never beats a specific product on a tie
      return { offer: o, score, matched };
    })
    .sort((a, b) => b.score - a.score);
}

export function pickOffer(deck, cat) {
  const mode = deck.offer ?? 'auto';
  if (mode === 'none') return { offer: null, reason: 'deck.offer is "none"' };
  if (mode !== 'auto') {
    const o = cat.offers.find(x => x.id === mode);
    if (!o) throw new Error(`deck.offer "${mode}" is not in offers/catalogue.json`);
    return { offer: o, reason: `chosen in deck.json` };
  }
  const ranked = scoreOffers(deck, cat);
  const best = ranked[0];
  if (best && best.score >= cat.min_score) {
    return { offer: best.offer, reason: `auto: score ${best.score} (${best.matched.slice(0, 6).join(', ')})`, ranked };
  }
  const disc = (deck.discipline || 'general').toLowerCase();
  const id = cat.fallback[disc] || cat.fallback.default;
  return { offer: cat.offers.find(x => x.id === id), reason: `auto: no product scored ≥ ${cat.min_score} for discipline "${disc}", fallback → ${id}`, ranked };
}

export function offerUrl(o, slug, cat) {
  const q = cat.utm.replace('{slug}', encodeURIComponent(slug));
  return o.url + (o.url.includes('?') ? '&' : '?') + q;
}
