#!/usr/bin/env node
/**
 * Build the ANIMATED footer band: build/assets/footer-band.gif.
 *
 * Same 600x470 geometry and framing as the still `footer-band` in
 * render-assets.mjs, so it is a drop-in replacement — it is painted as the
 * footer td's background, which means every client that can't animate it (or
 * can't do background images at all) falls back to frame 1, i.e. exactly the
 * still design. Outlook shows frame 1; bgcolor #141414 catches the rest.
 *
 * Source is the smoker shot of ym-hero.mp4 — the hero video is a montage, and
 * scene detection puts that shot at 9.91s-13.15s. It is a slow push-in, so the
 * motion is subtle by nature.
 *
 *   node build-footer-gif.mjs [--start 10.0] [--dur 1.6] [--fps 5] [--colors 24] [--width 600]
 *
 * Everything except the video (torn paper edge, gradient scrim, paper strip
 * above the tear, dark block below the photo) is rendered once as a
 * transparent PNG and composited onto every frame, so the GIF matches the
 * still band pixel for pixel outside the moving photo.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME = resolve(HERE, '..', 'assets');
const OUT = resolve(HERE, 'build', 'assets');
const TMP = resolve(HERE, 'build', 'tmp');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? dflt : Number(process.argv[i + 1]);
};
const strArg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? dflt : process.argv[i + 1];
};
const START = arg('start', 10.0);
const DUR = arg('dur', 1.6);
const FPS = arg('fps', 5);
const COLORS = arg('colors', 24);
const DITHER = strArg('dither', 'none');
const OUT_NAME = strArg('out', 'footer-band.gif');

// Band geometry — keep in lockstep with render-assets.mjs `footer-band`.
// --width renders the same composition larger for the 750px design canvas;
// the email always uses 600.
const S = arg('width', 600) / 600;
const W = Math.round(600 * S), H = Math.round(470 * S);
const TORN = Math.round(26 * S);
// The frame runs FULL WIDTH and uncropped, so it reads as the establishing
// shot it is; 16:9 at W wide. The scrim fades it to solid #141414 by PHOTO_H,
// so the hot links and fine print below sit on flat dark, not on the smoker's
// chrome handle. Mirrors the `footer-band` still in render-assets.mjs.
const PHOTO_H = Math.round(W * 1080 / 1920);

const asset = (f) => pathToFileURL(resolve(THEME, f)).href;

async function renderOverlay(file) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:transparent}
#s{position:relative;width:${W}px;height:${H}px;overflow:hidden}
</style></head><body><div id="s">
  <div style="position:absolute;left:0;right:0;top:0;height:${PHOTO_H}px;background:linear-gradient(180deg, rgba(14,14,14,.56) 0%, rgba(13,13,13,.80) 50%, rgba(20,20,20,1) 100%)"></div>
  <div style="position:absolute;left:0;right:0;top:${PHOTO_H - 2}px;bottom:0;background:#141414"></div>
  <div style="position:absolute;left:0;right:0;top:0;height:${TORN}px;background:#ede4d3"></div>
  <img src="${asset('ym-torn-edge-merged.png')}" style="position:absolute;left:-2%;top:-2px;width:104%;display:block">
</div></body></html>`;
  const f = resolve(TMP, 'footer-overlay.html');
  writeFileSync(f, html);
  await page.setViewportSize({ width: W + 40, height: H + 40 });
  await page.goto(pathToFileURL(f).href);
  await page.waitForTimeout(120);
  await page.locator('#s').screenshot({ path: file, omitBackground: true, scale: 'css' });
  await browser.close();
}

const overlay = resolve(TMP, 'footer-overlay.png');
await renderOverlay(overlay);
console.log(`  overlay          ${W}x${H}`);

const gif = resolve(OUT, OUT_NAME);
const filter = [
  `[0:v]eq=contrast=1.12:saturation=0.9,`,
  `scale=${W}:${PHOTO_H}:flags=lanczos,pad=${W}:${H}:0:0:color=0x141414,setsar=1[v];`,
  `[v][1:v]overlay=0:0:format=auto[o];`,
  `[o]fps=${FPS},split[a][b];`,
  `[a]palettegen=max_colors=${COLORS}:stats_mode=diff[p];`,
  `[b][p]paletteuse=dither=${DITHER}:diff_mode=rectangle`,
].join('');

execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-ss', String(START), '-t', String(DUR),
  '-i', resolve(THEME, 'ym-hero.mp4'),
  '-i', overlay,
  '-filter_complex', filter,
  '-loop', '0', gif,
]);

const kb = statSync(gif).size / 1024;
console.log(`  ${OUT_NAME}  ${W}x${H}  ${FPS}fps  ${DUR}s  ${COLORS}c  dither=${DITHER}  ->  ${kb.toFixed(1)} KB`);

// keep the manifest honest so klaviyo.mjs upload picks the gif up
if (OUT_NAME === 'footer-band.gif') {
  const mf = resolve(OUT, 'manifest.json');
  const m = JSON.parse(readFileSync(mf, 'utf8'));
  m['footer-band'] = { file: 'footer-band.gif', w: W, h: H };
  writeFileSync(mf, JSON.stringify(m, null, 1) + '\n');
  console.log('  manifest: footer-band -> footer-band.gif');
}
