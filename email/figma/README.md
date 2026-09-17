# Figma → email (fidelity spike)

Rich's Figma frame **Emails › VS_Abandoned Cart Flow - 1** (`node 2216:4` in
file `EnIt5qzRTlNiND0WVrSbPK`) rebuilt as a real Klaviyo-ready email, to test
whether his file can drive the email set. Nothing here is wired into the live
pipeline yet: `build.mjs` and the twelve shipping templates are untouched.

```
node prep.mjs    # his art → email-ready assets in out/   (needs src/, see below)
node cart1.mjs   # → out/cart1.html + out/cart1.png + out/compare.png
```

## How the split works

| Layer | Source | Why |
|---|---|---|
| Photographic + torn-paper art | **Figma** (`src/` → `out/`) | designers own every pixel |
| Display type (headline, buttons, "Your Cart") | rendered here from the theme's woff2 | copy has to stay editable in the Obsidian note |
| Body type | live text, Arial Narrow | email cannot load Bananas VF as text |
| Cart rows, prices, totals | Klaviyo tags in code | a Figma frame cannot express a loop |
| Address + unsubscribe | code | legally required, absent from the frame |

## Decisions baked in

- **600px wide, not 750.** The frame is 750; Outlook clips past ~650. Every
  measurement is scaled by 0.8 and art is emitted at 2x, so proportions match
  the frame exactly.
- **The torn card is three pieces**: its torn top (with the title composited
  on), a solid middle that grows with the line items, and its torn bottom. A
  background image cannot stretch reliably in Outlook. The middle's width and
  fill are measured out of the PNG's own alpha and pixels, not guessed.
- **`src/` is gitignored** (21MB of Figma originals, and the asset URLs expire
  after 7 days). `out/` holds the derived, email-sized assets that ship.

## Known gaps

- The copy in the note is longer than the frame's placeholder lines, so the
  olive and black lines run to two and three lines instead of one each.
  Shorten the copy in the note, or the design gains a taller top block.
- `card-top.png` / `card-bottom.png` are ~130KB each; they need transparency
  for the torn edge, so they stay PNG. Total for this email is ~540KB.
- An invisible hairline in the frame (`node 2835:74`) is not reproduced.
