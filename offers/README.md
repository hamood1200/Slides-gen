# Offers

`catalogue.json` lists the Najdeah products that can appear as the mid-deck offer.

## How the pick works

1. Only offers whose `disciplines` include the deck's `discipline` (or `"any"`) are considered.
2. Each keyword (English and Arabic) is counted across the whole deck. A hit in a title counts three times.
3. The catch-all (Najdeah Space) has its score halved, so a specific product wins a tie.
4. The best score wins if it reaches `min_score`. Otherwise the deck gets `fallback[discipline]`, or `fallback.default`.

Arabic is matched after normalising (أ إ آ → ا, ة → ه, ى → ي, no diacritics), so write keywords in any spelling.

## Add a product

1. Read the live product page. All copy must match it: never add a claim the page does not make.
2. Add an entry with `id`, `product_id`, `url`, `image` (1200×1200 product art in `brand/offers/`, or `null` for the typographic card), `disciplines`, `keywords`, and `title`, `pitch` and `points` in both languages.
3. Run the pitch and points through `skills/humanizer/SKILL.md`.
4. Check with `node tools/pick-offer.mjs decks/<a deck on that topic>`.

`node tools/sync-catalogue.mjs` lists store products that are missing from the catalogue.
Prices are left off the slides on purpose: they change, and the PDFs stay in circulation for years.
Links carry UTM tags (`utm_source=free-slides&utm_campaign=<deck slug>`) so sales from each deck can be traced.
