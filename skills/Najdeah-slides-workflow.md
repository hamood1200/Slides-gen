# Najdeah slides workflow (skill)

Use this when the user hands over content for a free deck. CLAUDE.md has the binding rules; this is the craft.

## From content to slides

- **One idea per slide.** If a slide needs two titles, it is two slides.
- **Pick the type from the idea**, never the other way round:
  - a list of facts → `bullets` (add a real photo from `tools/find-photo.mjs`, with `callouts` when the parts matter)
  - a drawing (from a reference PDF or an SVG) → `bullets` with `image` and Arabic `tags` written on it; in Arabic decks keep technical terms in English (the user finds many translations silly)
  - a trend or a comparison of numbers → `bullets` with a `chart`, and the points saying what the chart shows
  - two options → `compare`, always with a one-line `verdict`
  - a process → `steps`
  - a calculation → `formula`: rule of thumb, LaTeX formula in `tex`, worked example with real numbers, what to do with the result
  - reference data → `table`
  - three or four headline numbers with a source → `stats`
  - the closing thought → `takeaway`
- **Sections**: 2 to 5. Each section title is a plain noun phrase; it becomes an agenda row.
- **Budget**: cover + remembrance + presenter + agenda + offer + closing = 6, so the body gets 19 slides at most (34 when deck.json sets `"max_slides": 40`). The presenter slide is "About Najdeah", not a person.
- Old lecture decks often have a title and a picture only. Add the explanation a beginner needs, but only facts you can stand behind. When a number is not in the user's material, label it as an example value and tell the user in the wrap-up.

## Writing

1. Draft in the Najdeah-writes voice.
2. Run every string through the humanizer checklist. On slides the common slips are:
   - dashes (use a comma, a colon or a new sentence)
   - "not X, but Y" framing
   - lists forced into threes
   - Title Case (use sentence case)
   - words like "crucial", "robust", "seamless", "leverage"
   - bold on more than one word per slide
3. Arabic is written fresh. Do not translate the English word for word. Keep English numerals and English terms (`MPPT`, `IEC 61215`); the renderer isolates them so they never flip.

## Checking

- The build prints the offer pick and its reason. Read it.
- OVERFLOW means text spilled. Cut words first; split the slide second; never shrink the type.
- Look at both language sheets. Arabic runs about 15% longer.
- Photos: pick ones that show the thing plainly, at 1000px or wider. Check the picture really is what the slide says (search results mislabel things). Callout labels go through the humanizer too.
