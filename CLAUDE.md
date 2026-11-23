# Slides-gen: how to work in this repo

This repo turns content from Eng. Nooraldean into free Najdeah slide decks (PDF) in Arabic, English or both.
Any engineering field is in scope, not only solar. Sister repo: hamood1200/Books-gen (books, same design system).

## The rules that never bend

1. **25 slides at most**, counting cover, presenter, agenda, offer and closing. A deck may raise this with `"max_slides": 40` in deck.json (the hard ceiling is 40) when the user asks for a longer deck. The build stops above the limit.
2. **The Najdeah logo is on every slide.** The renderer puts it there; never remove it.
3. **One offer in the middle of every deck**, for a Najdeah product related to the topic. `"offer": "auto"` picks it (see offers/README.md). Use `"none"` only when the user asks.
4. **Every piece of writing goes through `skills/humanizer/SKILL.md`.** No exceptions: slide text, offer copy, captions, notes. Read the skill before writing, then run each slide's text through its checklist before the build.
5. **Never invent numbers, standards or product claims.** Values come from the user's content, a cited source, or are labelled as example values ("γ, example value"). Offer copy comes from the live product page.
6. **Every deck opens with remembrance.** Slide 2 is "لا إله إلا الله", in Arabic in every language (English decks add the transliteration and meaning). The build adds it; `"dhikr": false` only if the user asks.
7. **Clear for everyone.** Short sentences, one idea per slide, everyday words. Explain a term the first time it appears.

## The workflow

1. **Ask** (AskUserQuestion, one round): language (ar / en / both), discipline (solar, electrical, mechanical, civil, structural, energy, business, project-management, general...), cover picture (a line drawing in `cover.drawing`, a photo, or none).
2. **Plan**: turn the content into a slide list in `decks/<slug>/deck.json`. Start from `decks/_template/deck.json`. One idea per slide. Group slides into 2 to 5 sections; the agenda is built from the section titles.
3. **Write** in the voice of `skills/Najdeah-writes.md` (practitioner-mentor: rule of thumb, formula, worked example, decision), then **humanize** every string with `skills/humanizer/SKILL.md`. Arabic: simple Modern Standard Arabic, English numerals, English technical terms kept as they are (MPPT, IEC 61215, Conductor, XLPE Insulation, Cross Bonding). Do not translate a term whose Arabic sounds stilted; the user prefers the English term and a plain Arabic sentence around it. Avoid brackets around an English word at the edge of an Arabic line (bidi flips them).
4. **Check the offer**: `node tools/pick-offer.mjs decks/<slug>`. If the pick is wrong, add keywords to the catalogue or set `"offer": "<id>"`.
5. **Build**: `node build.mjs decks/<slug> --no-pdf`. Fix every warning and every OVERFLOW line.
6. **Look**: open `out/<slug>/<slug>-<lang>-sheet.png`, and `node tools/shot.mjs <slug> <lang> <n>` for any slide that needs a close look. Show the sheet to the user and wait for approval.
7. **Ship**: `node build.mjs decks/<slug>` writes the PDF(s). Commit `decks/<slug>/` (out/ is ignored).

## Slide types

`section`, `bullets` (optional image or `chart`, note), `compare` (2 columns + verdict), `steps` (3 to 5), `stats` (2 to 4), `formula` (rule + `tex` formula + worked example), `table` (up to 7 rows), `image`, `takeaway`.

- **Equations** are LaTeX, drawn by KaTeX: `"tex": "I = \\frac{S}{\\sqrt{3}\\,V}"` on a formula slide, and `$...$` inline in any text.
- **Charts**: a `"chart"` block (bar or line) on a bullets slide; `lib/chart.mjs` has the format at the top. Values are real or labelled as example values.
- **Photos** are real and openly licensed: `node tools/find-photo.mjs "power transformer"` lists Openverse results, `--get <n> decks/<slug> <name>` saves one and writes its credit to `img/credits.json`. The slide prints the credit; never delete it (BY and BY-SA require it).
- **Tags**: `"tags": [{ "x": 30, "y": 60, "text": {"ar": "صندوق ربط مؤرض"} }]` writes short Arabic notes straight onto a drawing (x, y in % of the picture; `"end": true` anchors the note's right edge at x). Every drawing in an Arabic deck gets Arabic notes beside its English labels. For a PDF figure, take label positions from `page.get_text('dict', clip=Rect)`. In a bilingual deck write `"tags": { "ar": [...], "en": [] }`, since the drawing's own English labels are enough in English.
- **Inline SVG**: a local `.svg` image is inlined, so its text uses the deck fonts. `tools/cable-section.py <spec.json>` draws cable cross-sections (English layer name with a note under it) as `name.svg` (Arabic notes) and `name-en.svg` (English notes); point a slide at both with `"image": { "ar": "...svg", "en": "...-en.svg" }`.
- **Callouts**: `"callouts": [{ "x": 45, "y": 18, "label": {...} }]` puts numbered balloons on a photo (x, y in % of the picture) with a legend under it.
- **Cover drawing**: `"cover": { "drawing": "decks/<slug>/img/sld.svg" }` inlines an SVG line drawing (stroke `currentColor`, class `acc` for red parts) instead of a photo.
Cover, the remembrance slide, presenter, agenda, offer and closing are added by the build. `"presenter": false` or `"agenda": false` in deck.json turns those off.

The presenter slide is "About Najdeah" (عن نجديه): decks are credited to the Najdeah site, never to a person. Its text, eyebrow, photo and `photo_position` come from `brand/brand.json`.

When the user supplies a reference PDF (a catalogue or a standard), take figures from it with PyMuPDF (`page.get_pixmap(dpi=200, clip=Rect)`) into `decks/<slug>/img/`, and cite the source on a closing "المراجع" slide instead of credits.json. For landscape drawings, set `"fit": "contain", "wide": true` on the slide so the drawing gets more of the sheet.

## Limits that keep slides readable

- Title under 70 characters. Up to 6 points. A point under 120 characters.
- One picture per slide. Put deck pictures in `decks/<slug>/img/` with plain names.
- Images in the user's old decks are low resolution; prefer `fit: "contain"` for diagrams.
- A photo with callouts plus 5 points with subs is the fullest a slide gets.

## Where things live

| Path | What |
|---|---|
| `build.mjs` | the build: plan, checks, HTML, overflow check, sheet, PDF |
| `lib/render.mjs` | one function per slide type |
| `lib/validate.mjs` | errors and warnings |
| `lib/offers.mjs` | offer scoring and fallback |
| `lib/text.mjs` | language picking, `**bold**`, `` `term` ``, Latin isolation in Arabic |
| `theme/slides.css` | the look: an engineering drawing sheet (see below) |
| `lib/chart.mjs` | bar and line charts as inline SVG |
| `tools/find-photo.mjs` | open-licence photo search and download with credit |
| `brand/` | logo, fonts, photos, presenter details (`brand.json`), offer product art |
| `offers/catalogue.json` | the products, keywords and offer copy |
| `skills/` | Najdeah-writes voice, humanizer (vendored), slides workflow |

## The theme

Every slide is an engineering drawing sheet: paper #f4f2eb with a 40px grid, navy #142846 ink, red #c8323c for marks, a double border with zone letters and numbers, and a title block along the bottom (logo, title, section, sheet n / total, najdeah.com). The logo sits first in the title block at 100px tall, plus a larger one on the cover and closing. Section, remembrance and closing slides are navy "blueprint" sheets. Fonts are IBM Plex Sans Arabic, IBM Plex Sans and IBM Plex Mono. Each content slide is numbered §section.slide.

**The build needs internet**: KaTeX and the IBM Plex fonts load from CDNs.

Madani (now only on the remembrance slide) has no digits in the demo fonts; the @font-face skips 0-9. Do not remove the `unicode-range`. `brand/palettes.css` is kept for Books-gen and is not used here.
