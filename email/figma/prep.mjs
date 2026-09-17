#!/usr/bin/env node
/**
 * Rich's Figma frame (Emails page, VS_Abandoned Cart Flow - 1, node 2216:4) →
 * email-ready assets. Figma is the source of truth for art; type still renders
 * locally from the theme's own fonts, so copy stays editable.
 *
 * The frame is 750 wide. Email renders at 600, the width Outlook shows without
 * clipping, so every measurement is scaled by 600/750 = 0.8 and art is emitted
 * at 2x for retina.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, 'src');
const OUT = resolve(HERE, 'out');
mkdirSync(OUT, { recursive: true });
const sips = (...a) => execFileSync('sips', a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...a], { stdio: ['ignore', 'pipe', 'pipe'] });
const dims = (f) => { const o = sips('-g', 'pixelWidth', '-g', 'pixelHeight', f); return { w: +o.match(/pixelWidth: (\d+)/)[1], h: +o.match(/pixelHeight: (\d+)/)[1] }; };
const SCALE = 600 / 750;
const px = (n) => Math.round(n * SCALE);      // frame px → email px
const at2x = (n) => Math.round(n * SCALE * 2); // frame px → 2x asset px

/** Average colour of a region, so the card's solid middle matches its paper. */
function avgColour(file, cw, ch, cx, cy) {
  const raw = execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-vf', `crop=${cw}:${ch}:${cx}:${cy},scale=1:1`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 20 });
  return '#' + [...raw.slice(0, 3)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const report = {};

// ---- 1. paper background: his texture, 600 wide, tiling down the page ------
{
  const f = resolve(OUT, 'paper.jpg');
  // his texture is 2731x4096; take a 1200x1600 window from the middle so the
  // grain reads without shipping a 2MB background
  ff('-i', resolve(SRC, 'paper.png'), '-vf', 'scale=1200:-2,crop=1200:1600:0:100', '-q:v', '6', f);
  report.paper = { file: 'paper.jpg', ...dims(f), colour: avgColour(f, 200, 200, 500, 800) };
}

// ---- 2. the torn "Your Cart" card, as a top edge + solid middle + bottom ---
// A background image cannot stretch reliably in Outlook, so the card is built
// as three rows: its torn top, a solid middle that grows with the line items,
// and its torn bottom. The grain only reads at the edges anyway.
{
  const src = resolve(SRC, 'cart-card.png');
  const { w, h } = dims(src);                      // 1024 x 854, rotated 177° in Figma
  const CARD_W = at2x(580);                        // 928
  const rot = resolve(OUT, '_card-rot.png');
  ff('-i', src, '-vf', 'rotate=177.36*PI/180:fillcolor=none:ow=rotw(177.36*PI/180):oh=roth(177.36*PI/180)', rot);
  const r = dims(rot);
  // trim the transparent margin the rotation adds
  const inset = Math.round(Math.min(r.w, r.h) * 0.02);
  const trim = resolve(OUT, '_card-trim.png');
  ff('-i', rot, '-vf', `crop=${r.w - inset * 2}:${r.h - inset * 2}:${inset}:${inset},scale=${CARD_W}:-1`, trim);
  const t = dims(trim);
  const EDGE = Math.round(t.h * 0.22);
  ff('-i', trim, '-vf', `crop=${t.w}:${EDGE}:0:0`, resolve(OUT, 'card-top.png'));
  ff('-i', trim, '-vf', `crop=${t.w}:${EDGE}:0:${t.h - EDGE}`, resolve(OUT, 'card-bottom.png'));
  report.card = {
    top: { file: 'card-top.png', ...dims(resolve(OUT, 'card-top.png')) },
    bottom: { file: 'card-bottom.png', ...dims(resolve(OUT, 'card-bottom.png')) },
    fill: avgColour(trim, Math.round(t.w * 0.5), Math.round(t.h * 0.3), Math.round(t.w * 0.25), Math.round(t.h * 0.35)),
    widthCss: Math.round(CARD_W / 2),
  };
}

// ---- 3. footer photo band --------------------------------------------------
{
  const f = resolve(OUT, 'footer.jpg');
  // cover a 600x499 slot at 2x: scale to the target height first, then centre-crop
  const H = at2x(624);
  ff('-i', resolve(SRC, 'footer-photo.png'), '-vf', `scale=-2:${H},crop=1200:${H}`, '-q:v', '5', f);
  report.footer = { file: 'footer.jpg', ...dims(f), colour: avgColour(f, 400, 200, 400, 600) };
}

// ---- 4. vectors → PNG (email clients do not render SVG) --------------------
const browser = await chromium.launch();
async function svgToPng(svgFile, outFile, cssW) {
  const svg = readFileSync(resolve(SRC, svgFile), 'utf8');
  const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 2 });
  await page.setContent(`<body style="margin:0;background:transparent"><div id="a" style="width:${cssW}px">${svg.replace(/width="[\d.]+"/, 'width="100%"').replace(/height="[\d.]+"/, '')}</div></body>`);
  await page.locator('#a').screenshot({ path: outFile, omitBackground: true });
  await page.close();
  return dims(outFile);
}
report.logo = { file: 'logo.png', ...(await svgToPng('logo-badge.svg', resolve(OUT, 'logo.png'), px(146))), widthCss: px(146) };

// ---- 5. the marker annotation: his Permanent Marker note + arrow, as one --
{
  const fonts = ['permanent-marker'].map((n) => `@font-face{font-family:Marker;src:url(data:font/woff2;base64,${readFileSync(resolve(HERE, '..', '..', 'assets', `${n}.woff2`)).toString('base64')}) format('woff2')}`).join('');
  const arrow = readFileSync(resolve(SRC, 'arrow.svg'), 'utf8').replace(/width="[\d.]+"/, 'width="100%"').replace(/height="[\d.]+"/, '');
  const page = await browser.newPage({ viewport: { width: 500, height: 300 }, deviceScaleFactor: 2 });
  await page.setContent(`<body style="margin:0;background:transparent"><style>${fonts}</style>
    <div id="a" style="position:relative;width:${px(200)}px;height:${px(70)}px">
      <div style="position:absolute;left:0;top:${px(8)}px;width:${px(91)}px;font-family:Marker;font-size:${px(15)}px;line-height:${px(18)}px;color:#918450;text-transform:uppercase;text-align:center">Before the Next cookout</div>
      <div style="position:absolute;left:${px(96)}px;top:0;width:${px(55)}px;transform:scaleX(-1)">${arrow}</div>
    </div></body>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#a').screenshot({ path: resolve(OUT, 'note.png'), omitBackground: true });
  await page.close();
  report.note = { file: 'note.png', ...dims(resolve(OUT, 'note.png')), widthCss: px(200) };
}
await browser.close();

// ---- measurements the template needs, all derived from the frame -----------
report.layout = {
  emailWidth: 600, frameWidth: 750, scale: SCALE,
  headline: { font: 'Milenia', size: px(72), colour: '#918450', lineHeight: px(80) },
  lede:     { font: 'BananasVF', size: px(40), colour: '#918450' },
  sub:      { font: 'BananasVF', size: px(32), colour: '#000000' },
  cardTitle:{ font: 'Milenia', size: px(32), colour: '#000000' },
  pill:     { font: 'Milenia', size: px(35), colour: '#ffffff', bg: '#ff0000', radius: px(20), w: px(309), h: px(57) },
  footerCopy:{ font: 'BananasVF', size: px(28), colour: '#ffffff' },
};
writeFileSync(resolve(HERE, 'manifest.json'), JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify(report, null, 1));
