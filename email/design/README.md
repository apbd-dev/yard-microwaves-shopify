# YM email design canvas

Design surface for Yard Microwaves emails — artboards in the website's real
fonts and tokens, published as the "YM Email System" canvas artifact. Rich
describes changes in plain language; the **ym-email skill** (sealab) is the
editor and holds the full procedure. Summary:

- `src/*.dc.src.html` — artboard sources (edit these; `@@FONTS@@` marker required)
- `build-canvas.mjs` — substitutes theme woff2 fonts, writes `*.dc.html`
- `canvas.json` — artboard layout + sticky notes
- images — downsampled brand assets referenced by filename
- `ym-email-system.html` — seeded canvas (generated; never hand-edit)

Canvas artifact URL (stable, always republish to it):
https://claude.ai/code/artifact/3aac2f27-debf-4074-99a2-168b4bae2049

The `../` pipeline (build.mjs / klaviyo.mjs) is the delivery side: "bake"
renders approved artboards into image-first Klaviyo templates — only the
order-ticket block and footer fine print remain dynamic text.

The canvas is both the design AND review surface — Figma is not part of this
workflow (the Emails page frames in the YardMicrowaves Figma file are frozen
legacy).
