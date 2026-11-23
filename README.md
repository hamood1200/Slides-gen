# Najdeah free slides

You write the content. This repo turns it into a branded slide deck as a PDF, in Arabic, English or both.

- 25 slides at most (up to 40 with `"max_slides"` in deck.json)
- The Najdeah logo on every slide
- Opens with a "لا إله إلا الله" slide right after the cover
- One offer in the middle for a Najdeah product that matches the topic, picked automatically
- Works for any engineering field: solar, electrical, mechanical, civil, structural, project management and more

> **بالعربي باختصار:** تعطي المحتوى، والريبو يطلع سلايدات بتصميم نجديّة (PDF) بالعربي أو الإنجليزي أو الاثنين. الحد الأقصى 25 سلايد، واللوجو على كل سلايد، وأول سلايد بعد الغلاف «لا إله إلا الله»، وفي النص عرض لمنتج من نجديّة له علاقة بالموضوع.

## Make a deck in four steps

1. Copy the template:
   ```bash
   cp -R decks/_template decks/my-topic
   ```
2. Edit `decks/my-topic/deck.json`. Write the title, choose the field (`"discipline"`), and fill in the slides.
3. Build it:
   ```bash
   node build.mjs decks/my-topic
   ```
4. Open `out/my-topic/`. You get one PDF per language and a contact sheet (all slides on one picture) to check.

Only one language? Add `--lang ar` or `--lang en`. Want to check the layout first without a PDF? Add `--no-pdf`.

You need Node 20+, Google Chrome and an internet connection (equations and fonts load from a CDN). Nothing to install with npm.

## What a slide looks like in deck.json

```json
{ "type": "bullets",
  "title": { "en": "Concrete blocks", "ar": "البلوكات الخرسانية" },
  "points": { "en": ["Used on flat roofs"], "ar": ["تُستخدم على الأسطح المستوية"] },
  "image": "decks/my-topic/img/blocks.jpg" }
```

Any text can be a single string (same in both languages) or `{ "en": ..., "ar": ... }`.
The template shows every slide type: section, bullets, compare, steps, stats, formula, table, image, takeaway.

Equations are LaTeX (`"tex"` on a formula slide, `$...$` inside any text). Bullets slides can carry a bar or line `"chart"` (format at the top of `lib/chart.mjs`) or a photo with numbered `"callouts"`.

## Real photos

```bash
node tools/find-photo.mjs "power transformer substation"
node tools/find-photo.mjs "power transformer substation" --get 3 decks/my-topic transformer
```

The first lists openly licensed photos from Openverse (Wikimedia Commons, Flickr and more; no key needed). The second saves one to `decks/my-topic/img/` and records its credit in `img/credits.json`. The credit prints under the photo on the slide.

The build adds the cover, the "لا إله إلا الله" slide, the presenter page, the agenda, the offer and the thank-you page by itself.

## The offer in the middle

`"offer": "auto"` reads the whole deck and picks the product that matches it best. A structures deck gets the structures guide, a power-plant deck gets the plant guide.
When no product matches (a chiller deck, say), it falls back to Najdeah Space.
To see the choice and the reason before building:

```bash
node tools/pick-offer.mjs decks/my-topic
```

To force one: `"offer": "ppa-guide"`. To leave it out: `"offer": "none"`. Products and their keywords live in `offers/catalogue.json`. See `offers/README.md` to add a new one.

## Writing rules

All text is written in the Najdeah voice (`skills/Najdeah-writes.md`) and checked with the humanizer skill (`skills/humanizer/`). Refresh the humanizer from GitHub with `node tools/sync-humanizer.mjs`.

## Example

`decks/pv-mounting-structures/` is a full 25-slide deck in Arabic and English, built from the "7 Structure" lecture.
`decks/substation-132-13-8kv/` shows photos with credits and callouts, charts, LaTeX formulas and a line-drawing cover.
