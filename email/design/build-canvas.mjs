#!/usr/bin/env node
/**
 * Regenerate the canvas artboards from src/: substitute the theme's real
 * fonts (as data URIs) and the shared chrome from src/partials/ into each
 * src/<Name>.dc.src.html and write <Name>.dc.html beside this script.
 *
 * Markers: @@FONTS@@ · @@HEADER@@ (src/partials/header.html) · @@FOOTER@@
 * (src/partials/footer.html). The header/footer live in ONE place so every
 * email shares them — never paste chrome into an individual artboard.
 *
 * Run after ANY edit to a src file or partial:
 *
 *   node build-canvas.mjs
 *
 * The .dc.html outputs are what get seeded into the design canvas (see the
 * ym-email skill) and what bake-to-Klaviyo renders. They also open directly
 * in a browser from this directory (images resolve by filename).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME_ASSETS = resolve(HERE, '..', '..', 'assets');

const b64 = (f) => readFileSync(resolve(THEME_ASSETS, f)).toString('base64');
const FONTS = `    @font-face { font-family: 'Milenia'; src: url(data:font/woff2;base64,${b64('milenia.woff2')}) format('woff2'); }
    @font-face { font-family: 'Bananas'; src: url(data:font/woff2;base64,${b64('bananas-vf-regular.woff2')}) format('woff2'); font-weight: 100 900; }
    @font-face { font-family: 'BananasExp'; src: url(data:font/woff2;base64,${b64('bananas-vf-bold-expanded.woff2')}) format('woff2'); font-weight: 100 900; }
    @font-face { font-family: 'Marker'; src: url(data:font/woff2;base64,${b64('permanent-marker.woff2')}) format('woff2'); }`;

const srcDir = resolve(HERE, 'src');
const partial = (n) => readFileSync(resolve(srcDir, 'partials', `${n}.html`), 'utf8').trimEnd();
const PARTS = { FONTS, HEADER: partial('header'), FOOTER: partial('footer') };

for (const f of readdirSync(srcDir).filter((f) => f.endsWith('.dc.src.html'))) {
  const out = basename(f).replace('.dc.src.html', '.dc.html');
  let html = readFileSync(resolve(srcDir, f), 'utf8');
  for (const [name, value] of Object.entries(PARTS)) {
    const marker = `@@${name}@@`;
    // System.dc.src.html is the spec sheet, not an email — chrome is optional there.
    if (!html.includes(marker)) { if (name === 'FONTS') console.warn(`  ! ${f} has no ${marker} marker`); continue; }
    html = html.replaceAll(marker, value);
  }
  writeFileSync(resolve(HERE, out), html);
  console.log(`  ${out}`);
}
console.log('build-canvas: done');
