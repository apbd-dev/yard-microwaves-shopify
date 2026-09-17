# YM Klaviyo email set

Every Yard Microwaves Klaviyo message, built from the theme's own fonts and art.
The repo is the source of truth; Klaviyo holds code templates it never rewrites.

## Changing copy (the common case)

Copy lives in **`copy.json`** as plain text. Rich edits it through the **Copy tab**
of the [YM Email Inventory](https://docs.google.com/spreadsheets/d/1Ppl-zgbqZvi7G_AkR3JGCHuiuDzBEqc7tVrCSB2mRnY/edit)
sheet: column D is the current copy, column E is his replacement.

```
npm run copy:check   # show the edits waiting on the sheet, change nothing
npm run copy:sync    # pull edits → render type → upload → build → push templates
                     # → wire flows (emails + SMS) → preview → refresh the tab
```

`copy:sync` needs `KLAVIYO_YM_API_KEY` in the environment and the `gws` CLI
signed in. After it runs, the edits have become the current copy and column E
is empty again. Review `build/previews/contact-sheet.png`, then commit `copy.json`,
`assets.json`, `templates.json` and `flows.json`.

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
| `sheet.mjs` / `sheet.json` | Copy tab ↔ `copy.json` (`push`, `pull`) |
| `render-assets.mjs`, `build-footer-gif.mjs` | brand type and art → PNG/GIF (`npm run assets`) |
| `build.mjs` | composes the templates from shared components |
| `klaviyo.mjs` | `upload` assets, `push` templates, `render` previews, `wire` flows |
| `flows.json` | which flow action sends which email, and the template clone Klaviyo made |
| `design/` | the YM Email System canvas sources (design + Klaviyo previews) |

Klaviyo quirks worth knowing: flow actions are only editable at API revision
2025-10-15 and the whole definition must be sent back; assigning a template to
a flow message clones it, so `wire` tracks clones by source hash; templates push
as `editor_type: CODE`.
