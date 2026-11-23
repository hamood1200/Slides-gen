#!/usr/bin/env node
// Shows which offer a deck would get and why:  node tools/pick-offer.mjs decks/<slug>
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadCatalogue, pickOffer } from '../lib/offers.mjs';
const p = process.argv[2];
if (!p) { console.error('usage: node tools/pick-offer.mjs decks/<slug>'); process.exit(1); }
const deck = JSON.parse(readFileSync(resolve(p, p.endsWith('.json') ? '' : 'deck.json'), 'utf8'));
const cat = loadCatalogue(new URL('../', import.meta.url));
const r = pickOffer(deck, cat);
console.log(`discipline: ${deck.discipline || 'general'}`);
console.log(`offer: ${r.offer ? r.offer.id : 'none'}  (${r.reason})`);
for (const x of r.ranked || []) console.log(`  ${String(x.score).padStart(5)}  ${x.offer.id.padEnd(18)} ${x.matched.slice(0, 8).join(', ')}`);
