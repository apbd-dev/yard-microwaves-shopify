# YM Klaviyo email set

Every Yard Microwaves Klaviyo message, built from the theme's own fonts and art.
The repo is the source of truth; Klaviyo holds code templates it never rewrites.

## Changing copy (the common case)

Every word lives in ONE markdown file Rich edits in Obsidian:
`vault/04 - Content/newsletter/YM Email Copy.md` (path in `doc.json`). The repo
keeps the same copy as data in `copy.json`.

```
npm run copy:check   # show what he changed in the note, touch nothing
npm run copy:sync    # pull the note → render type → upload → build → push templates
                     # → wire flows (emails + SMS) → preview → rewrite the note
npm run copy:doc     # note ← copy.json, after editing the copy from chat
```

`copy:sync` needs `KLAVIYO_YM_API_KEY` in the environment. It is idempotent: run
it twice with no edits and nothing changes anywhere. Review
`build/previews/contact-sheet.png`, then commit `copy.json`, `assets.json`,
`templates.json`, `flows.json` and the note in the vault repo.

Tokens: `{first name}`, `{order #}`, `{coupon}` (still the `INSERT-COUPON`
placeholder), `{checkout link}` and `{tracking link}` (SMS). A blank line in a
body is a paragraph break. Headlines and button labels render as images, so a
change there uploads a new image to Klaviyo, and uploads are permanent.

Campaigns (`campaigns` in `copy.json`: drop announcement, finale) build into
templates from the existing components as soon as their copy is written. No new
art is required.

## Files

| File | What it is |
|---|---|
| `copy.json` / `copy.mjs` | the copy, and its conversion to HTML + Klaviyo tags |
| `doc.mjs` / `doc.json` | the Obsidian note ↔ `copy.json` (`push`, `pull`) |
| `render-assets.mjs`, `build-footer-gif.mjs` | brand type and art → PNG/GIF (`npm run assets`) |
| `build.mjs` | composes the templates from shared components |
| `klaviyo.mjs` | `upload` assets, `push` templates, `render` previews, `wire` flows |
| `flows.json` | which flow action sends which email, and the template clone Klaviyo made |
| `design/` | the YM Email System canvas sources (design + Klaviyo previews) |

Klaviyo quirks worth knowing, all of them learned the hard way:

- Flow actions are only editable at API revision **2025-10-15**, and the whole
  definition must be sent back or it rejects the change.
- Assigning a template to a flow message **clones** it. The clone is read-only
  through the API (GET works, PATCH 404s) and comes back normalised, so its HTML
  never equals ours. `wire` therefore decides by bookkeeping in `flows.json`
  (clone id, source hash, and a fingerprint of the clone) rather than by
  comparing content — and re-assigns when someone edits the flow's copy inside
  Klaviyo, since the repo is the source of truth.
- Image uploads are **permanent** (no delete endpoint), so the asset render must
  be byte-stable or every sync leaks an image. `npm run assets` builds the
  animated footer band; `assets:still` does not and must never be used in the
  sync, or the footer silently downgrades to a still and re-uploads.
- Templates push as `editor_type: CODE`; drag-and-drop refuses HTML with no
  regions and rewrites what it accepts.
