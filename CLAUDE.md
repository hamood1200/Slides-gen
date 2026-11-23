# Slides-gen: how to work in this repo

This repo turns content from Eng. Nooraldean into free Najdeah slide decks (PDF) in Arabic, English or both.
Any engineering field is in scope, not only solar. Sister repo: hamood1200/Books-gen (books, same design system).

## The rules that never bend

1. **25 slides at most**, counting cover, presenter, agenda, offer and closing. The build stops above 25.
2. **The Najdeah logo is on every slide.** The renderer puts it there; never remove it.
3. **One offer in the middle of every deck**, for a Najdeah product related to the topic. `"offer": "auto"` picks it (see offers/README.md). Use `"none"` only when the user asks.
4. **Every piece of writing goes through `skills/humanizer/SKILL.md`.** No exceptions: slide text, offer copy, captions, notes. Read the skill before writing, then run each slide's text through its checklist before the build.
5. **Never invent numbers, standards or product claims.** Values come from the user's content, a cited source, or are labelled as example values ("γ, example value"). Offer copy comes from the live product page.
6. **Every deck opens with remembrance.** Slide 2 is "لا إله إلا الله", in Arabic in every language (English decks add the transliteration and meaning). The build adds it; `"dhikr": false` only if the user asks.
7. **Clear for everyone.** Short sentences, one idea per slide, everyday words. Explain a term the first time it appears.

## The workflow

1. **Ask** (AskUserQuestion, one round): language (ar / en / both), discipline (solar, electrical, mechanical, civil, structural, energy, business, project-management, general...), palette, cover photo (one from brand/photos, the user's own, or none).
2. **Plan**: turn the content into a slide list in `decks/<slug>/deck.json`. Start from `decks/_template/deck.json`. One idea per slide. Group slides into 2 to 5 sections; the agenda is built from the section titles.
3. **Write** in the voice of `skills/Najdeah-writes.md` (practitioner-mentor: rule of thumb, formula, worked example, decision), then **humanize** every string with `skills/humanizer/SKILL.md`. Arabic: simple Modern Standard Arabic, English numerals, English technical terms kept as they are (MPPT, IEC 61215).
4. **Check the offer**: `node tools/pick-offer.mjs decks/<slug>`. If the pick is wrong, add keywords to the catalogue or set `"offer": "<id>"`.
5. **Build**: `node build.mjs decks/<slug> --no-pdf`. Fix every warning and every OVERFLOW line.
6. **Look**: open `out/<slug>/<slug>-<lang>-sheet.png`, and `node tools/shot.mjs <slug> <lang> <n>` for any slide that needs a close look. Show the sheet to the user and wait for approval.
7. **Ship**: `node build.mjs decks/<slug>` writes the PDF(s). Commit `decks/<slug>/` (out/ is ignored).

## Slide types

`section`, `bullets` (optional image, note), `compare` (2 columns + verdict), `steps` (3 to 5), `stats` (2 to 4), `formula` (rule + formula + worked example), `table` (up to 7 rows), `image`, `takeaway`.
Cover, the remembrance slide, presenter, agenda, offer and closing are added by the build. `"presenter": false` or `"agenda": false` in deck.json turns those off.

## Limits that keep slides readable

- Title under 70 characters. Up to 6 points. A point under 120 characters.
- One picture per slide. Put deck pictures in `decks/<slug>/img/` with plain names.
- Images in the user's old decks are low resolution; prefer `fit: "contain"` for diagrams.

## Where things live

| Path | What |
|---|---|
| `build.mjs` | the build: plan, checks, HTML, overflow check, sheet, PDF |
| `lib/render.mjs` | one function per slide type |
| `lib/validate.mjs` | errors and warnings |
| `lib/offers.mjs` | offer scoring and fallback |
| `lib/text.mjs` | language picking, `**bold**`, `` `term` ``, Latin isolation in Arabic |
| `theme/slides.css` | the look; tokens from Books-gen |
| `brand/` | logo, fonts, palettes, photos, presenter details (`brand.json`), offer product art |
| `offers/catalogue.json` | the products, keywords and offer copy |
| `skills/` | Najdeah-writes voice, humanizer (vendored), slides workflow |

Madani demo fonts have no digits; the @font-face skips 0-9 so numbers fall to Fira Sans. Do not remove the `unicode-range`.
