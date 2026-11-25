# Slides-gen: how to work in this repo

This repo turns content from Eng. Nooraldean into free Najdeah slide decks (PDF) in Arabic, English or both.
Any engineering field is in scope, not only solar. Sister repo: hamood1200/Books-gen (books, same design system).

## The rules that never bend

1. **25 slides at most**, counting cover, presenter, agenda, offer and closing. A deck may raise this with `"max_slides": 40` in deck.json (the hard ceiling is 40) when the user asks for a longer deck. The build stops above the limit.
2. **The Najdeah logo is on every slide.** The renderer puts it there; never remove it.
3. **One offer in the middle of every deck**, for a Najdeah product related to the topic. `"offer": "auto"` picks it (see offers/README.md). Use `"none"` only when the user asks.
4. **Every piece of writing goes through `skills/humanizer/SKILL.md`.** No exceptions: slide text, offer copy, captions, notes. Read the skill before writing, then run each slide's text through its checklist before the build.
5. **Only the sources the user gave.** Every fact, number and standard comes from them. Nothing from memory or the web, unless the user asks; example values are labelled as such ("γ, example value"). Offer copy comes from the live product page.
6. **Every deck opens with remembrance.** Slide 2 is "لا إله إلا الله", in Arabic in every language (English decks add the transliteration and meaning). The build adds it; `"dhikr": false` only if the user asks.
7. **Clear for everyone.** Short sentences, one idea per slide, everyday words. Explain a term the first time it appears.

## The workflow

The same five steps every time, in this order. Colleagues run it through the `slides` skill (`skills/slides/SKILL.md`, `/slides-gen:slides` once the plugin is installed); inside this repo follow it by hand.

1. **Topic and language.** Ask what the deck is about and which language (ar / en / both). Pick the discipline yourself from the topic.
2. **Sources.** Ask for the sources: files, PDFs, links, notes. **Content comes only from them.** No outside facts, numbers or standards; if a slide needs something the sources do not have, tell the user and leave it out (or ask for another source). Cite them on a closing "المراجع" / "References" slide.
3. **Slide count.** Propose a number from what the sources can carry (25 at most, 40 when asked) and confirm it.
4. **Design.** Show `theme/gallery-ar.png` (or `-en.png`): ten designs, numbered. The user answers with a number; set `"theme": "<id>"` in deck.json (ids in `theme/themes.json`, in gallery order). With the user's title on the samples: `node tools/themes.mjs --lang ar --title "..." --out <deck>/themes`.
5. **Write, build, deliver.**
   - Plan the slides in `<deck>/deck.json` from `decks/_template/deck.json`. One idea per slide, 2 to 5 sections.
   - Write in the voice of `skills/Najdeah-writes.md`, then **humanize** every string with `skills/humanizer/SKILL.md`. Arabic: simple Modern Standard Arabic, English numerals, English technical terms kept as they are (MPPT, IEC 61215, Conductor, XLPE Insulation, Cross Bonding). Do not translate a term whose Arabic sounds stilted. Avoid brackets around an English word at the edge of an Arabic line (bidi flips them).
   - Check the offer: `node tools/pick-offer.mjs <deck>`.
   - `node build.mjs <deck> --no-pdf`. Fix every warning and every OVERFLOW line (cut words, then split; never shrink type).
   - Look at `<out>/<slug>-<lang>-sheet.png` (and `node tools/shot.mjs <out>/<slug>-ar.html <n>` for one slide). Show the sheet and wait for approval.
   - `node build.mjs <deck>` writes the PDF(s).

Decks can live anywhere. Inside this repo (`decks/<slug>/`) output goes to `out/<slug>/`; anywhere else it goes to `<deck>/out/`. Image paths resolve against the deck folder, then the current folder, then this repo.

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
| `theme/slides.css` | the base look, design 1 (see below) |
| `theme/themes/`, `themes.json`, `gallery-*.png` | the other nine designs, their list, the picker image |
| `tools/themes.mjs` | draws the design picker |
| `lib/chart.mjs` | bar and line charts as inline SVG |
| `tools/find-photo.mjs` | open-licence photo search and download with credit |
| `brand/` | logo, fonts, photos, presenter details (`brand.json`), offer product art |
| `offers/catalogue.json` | the products, keywords and offer copy |
| `skills/` | `slides` (the plugin skill), Najdeah-writes voice, humanizer (vendored), slides workflow |
| `.claude-plugin/` | plugin + marketplace manifests, so colleagues install this repo as a Claude Code plugin |

## The designs

Ten designs, listed in `theme/themes.json` in gallery order. `theme/slides.css` is the base and is design 1 (drawing); each other design is `theme/themes/<id>.css`, loaded after it, on `<html class="th-<id>">`. `"theme"` in deck.json picks one, `--theme <id>` overrides it.

1. drawing: engineering drawing sheet (paper #f4f2eb, 40px grid, navy ink, red marks, zone border, title block). Section, remembrance and closing are navy blueprint sheets.
2. blueprint: every slide blueprint blue with white and cyan lines.
3. datasheet: a maker's catalogue page; white, grey header band, green tab carrying §n.n.
4. hoarding: site safety board; yellow and black, hazard stripes, heavy titles.
5. notebook: squared paper, red margin, blue ink, hand-lettered titles, taped photos.
6. report: consultant report; white, navy masthead strip, teal rule, Kufi headings.
7. journal: cream stock, Naskh/serif headlines, oxblood; no dark pages.
8. swiss: white, black, one red; huge numerals; red section pages.
9. scada: dark HMI panels, status green and amber, mono labels, status bar.
10. print: black on white only, thick rules, grayscale photos; survives a photocopier.

Rules for every design: the logo stays in the footer and on the cover; the `logo` field (auto / white / color) picks which logo file. No violet, no gradient washes, no glow, one heading scale. A design that adds height to `.head` takes it back from its margin, so decks written for one design fit in all ten (all real decks build clean in all ten). Each content slide is numbered §section.slide. Change the gallery after editing a design: `node tools/themes.mjs --lang ar` and `--lang en`, then copy `out/themes/themes-<lang>.png` to `theme/gallery-<lang>.png`.

**The build needs internet**: KaTeX and the fonts load from CDNs.

Madani (now only on the remembrance slide) has no digits in the demo fonts; the @font-face skips 0-9. Do not remove the `unicode-range`. `brand/palettes.css` is kept for Books-gen and is not used here.
