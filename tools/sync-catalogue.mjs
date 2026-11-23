#!/usr/bin/env node
// Compares offers/catalogue.json with the live store (najdeah.com Store API).
// Prints products that are in the store but not in the catalogue, and catalogue entries whose product is gone.
// It never edits the catalogue: new products need hand-written keywords and copy.
import { loadCatalogue } from '../lib/offers.mjs';
const cat = loadCatalogue(new URL('../', import.meta.url));
const res = await fetch('https://najdeah.com/wp-json/wc/store/v1/products?per_page=100');
if (!res.ok) { console.error(`store API returned ${res.status}`); process.exit(1); }
const live = await res.json();
const known = new Set(cat.offers.map(o => o.product_id).filter(Boolean));
console.log('In the store, not in the catalogue:');
for (const p of live) if (!known.has(p.id)) console.log(`  ${p.id}  ${p.name}  ${p.permalink}`);
const ids = new Set(live.map(p => p.id));
console.log('In the catalogue, not in the store list:');
for (const o of cat.offers) if (o.product_id && !ids.has(o.product_id)) console.log(`  ${o.id} (product ${o.product_id})`);
