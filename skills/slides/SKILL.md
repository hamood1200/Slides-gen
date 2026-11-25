---
name: slides
description: |
  Make a free Najdeah slide deck as a PDF (Arabic, English or both) from the user's own sources,
  in one of ten ready designs. Use when the user asks for slides, a deck, a presentation or
  "سلايدات" / "عرض تقديمي" / "بريزنتيشن" on any engineering topic.
---

# Najdeah slides

You make a free Najdeah deck. The steps below always run in the same order. Do not skip one and do not merge two, even if the user gives several answers at once (then confirm what they gave and move on).

Talk to the user in their language (Arabic by default). Keep questions short.

## 0. Setup (silent, before the first question)

- **ROOT** is the plugin folder: two levels up from this skill's "Base directory" (the folder holding `build.mjs`). Use the absolute path in every command, quoted.
- Read `ROOT/CLAUDE.md` in full. Its rules bind every deck. Read `ROOT/skills/Najdeah-writes.md`, `ROOT/skills/humanizer/SKILL.md` and `ROOT/skills/Najdeah-slides-workflow.md` before writing any slide text.
- Check the tools: `node -v` (20 or newer) and Google Chrome (`/Applications/Google Chrome.app` on macOS, `google-chrome` or `chromium` on Linux, or the `CHROME` variable). If one is missing, tell the user what to install and stop.
- The deck goes in `./<slug>/` in the user's current folder (slug: short, English, kebab-case, from the topic). Output lands in `./<slug>/out/`.

## 1. Topic and language

Ask (AskUserQuestion where it fits):
- What is the deck about? (free text)
- Language: عربي / English / الاثنين

Pick the discipline yourself (solar, electrical, mechanical, civil, structural, energy, business, project-management, general).

## 2. Sources

Ask: "شو المصادر اللي بدك آخد منها؟ (ملفات PDF، روابط، كتالوجات، ملاحظات)". Wait for them.

- **Everything on the slides comes from these sources only.** No facts, numbers, standards or examples from memory or the web.
- Read every source fully. For a PDF use the Read tool (or PyMuPDF to pull figures into `./<slug>/img/`). For a link, fetch the page.
- If the sources do not cover something the topic needs, say so plainly and either leave it out or ask for another source. Never fill the gap yourself.
- A worked example may use round numbers only when labelled "قيم توضيحية / example values".
- The last body slide is "المراجع" / "References" listing the sources.

## 3. Slide count

From what the sources can carry, propose a count and ask the user to confirm it (AskUserQuestion, your proposal first). The count includes cover, remembrance, About Najdeah, agenda, offer and closing (6 slides), so a 25-slide deck has 19 body slides. Maximum 25; up to 40 only if the user asks (`"max_slides": 40`).

## 4. Design

Show the ten designs: send `ROOT/theme/gallery-ar.png` (`gallery-en.png` for an English deck) with SendUserFile if you have it; otherwise give the full path and tell the user to open it. Ask: "اختار رقم التصميم من 1 لـ 10". Do not use AskUserQuestion here (it holds only four options); take the number as free text.

Map the number to the id in `ROOT/theme/themes.json` (same order: 1 drawing, 2 blueprint, 3 datasheet, 4 hoarding, 5 notebook, 6 report, 7 journal, 8 swiss, 9 scada, 10 print) and set `"theme": "<id>"` in deck.json.

If the user wants to see the designs with their own title on them:
`node "ROOT/tools/themes.mjs" --lang ar --title "<title>" --out "./<slug>/themes"` (about a minute) and send `./<slug>/themes/themes-ar.png`.

## 5. Write, build, deliver

1. Copy `ROOT/decks/_template/deck.json` to `./<slug>/deck.json` and plan the slides: one idea per slide, 2 to 5 sections. Set `slug`, `discipline`, `languages`, `theme`, `"offer": "auto"`.
2. Write each slide in the Najdeah-writes voice, then run every string through the humanizer checklist. Arabic: simple Modern Standard Arabic, English numerals, English technical terms kept in English. Arabic notes go on every drawing (`tags`).
3. Pictures: figures from the user's sources first. For photos, `node "ROOT/tools/find-photo.mjs" "<english words>"` then `--get <n> ./<slug> <name>`; keep the credit. Image paths in deck.json are relative to the current folder (`<slug>/img/x.jpg`).
4. `node "ROOT/tools/pick-offer.mjs" ./<slug>`: read the pick; set `"offer": "<id>"` if it is wrong.
5. `node "ROOT/build.mjs" ./<slug> --no-pdf`. Fix every warning and every OVERFLOW line: cut words first, split the slide second, never shrink the type. Build again until clean.
6. Look at `./<slug>/out/<slug>-<lang>-sheet.png` yourself (for one slide: `node "ROOT/tools/shot.mjs" ./<slug>/out/<slug>-ar.html <n>`). Fix what looks wrong, then send the sheet to the user and wait for their OK.
7. `node "ROOT/build.mjs" ./<slug>` writes the PDF(s). Send the PDF and say in one or two lines: slide count, design, which offer, and any part the sources did not cover.

## Never

- Never credit a person on the slides; decks are credited to the Najdeah site (najdeah.com).
- Never remove the logo, the "لا إله إلا الله" slide or the mid-deck offer (offer only off if the user asks).
- Never edit files under ROOT for a single deck; the deck lives in the user's folder.
