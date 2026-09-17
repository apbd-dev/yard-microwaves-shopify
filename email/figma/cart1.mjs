#!/usr/bin/env node
/**
 * Abandoned Cart #1, rebuilt to Rich's Figma frame (Emails page, node 2216:4).
 * Art comes from figma/out (prep.mjs); display type is rendered here from the
 * theme's own fonts so the copy stays editable in the Obsidian note.
 *
 *   node cart1.mjs            # → out/cart1.html + out/cart1.png (local preview)
 *
 * Email-safe: tables, inline styles, no SVG, no flexbox, background images
 * paired with a bgcolor fallback. The torn card is a top edge, a solid middle
 * that grows with the line items, and a bottom edge.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, 'out');
const M = JSON.parse(readFileSync(resolve(HERE, 'manifest.json'), 'utf8'));
const L = M.layout;
const COPY = JSON.parse(readFileSync(resolve(HERE, '..', 'copy.json'), 'utf8')).emails['abandoned-cart-1'];

const font = (file, family) => `@font-face{font-family:${family};src:url(data:font/woff2;base64,${readFileSync(resolve(HERE, '..', '..', 'assets', file)).toString('base64')}) format('woff2')}`;
const FONTS = [font('milenia.woff2', 'Milenia'), font('bananas-vf-regular.woff2', 'Bananas'), font('permanent-marker.woff2', 'Marker')].join('');
const asset = (f) => `file://${resolve(OUT, f)}`;
const COND = "'Arial Narrow','Helvetica Neue',Helvetica,Arial,sans-serif";

const browser = await chromium.launch();

/** The torn edges have transparent margins, so the solid middle has to match
 *  the paper's real interior, not the image's box. Read one pixel row out of
 *  the PNG with ffmpeg and find where the opaque paper starts and stops.
 *  (A headless canvas cannot load these file:// images, so it is not used.) */
function rowOf(file, y) {
  const { w } = { w: null };
  const info = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', resolve(OUT, file)]).toString();
  const W = +info.match(/pixelWidth: (\d+)/)[1], H = +info.match(/pixelHeight: (\d+)/)[1];
  const row = y < 0 ? H + y : y;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', resolve(OUT, file), '-vf', `crop=${W}:1:0:${row}`, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 22 });
  let l = -1, r = -1;
  for (let i = 0; i < W; i++) { if (raw[i * 4 + 3] > 200) { if (l < 0) l = i; r = i; } }
  const m = Math.round((l + r) / 2) * 4;
  return { W, l, r, colour: '#' + [raw[m], raw[m + 1], raw[m + 2]].map((v) => v.toString(16).padStart(2, '0')).join('') };
}
const INT = { top: rowOf(M.card.top.file, -3), bottom: rowOf(M.card.bottom.file, 2) };
const scale = M.card.widthCss / M.card.top.w;          // asset px → css px
const interiorW = Math.round((INT.top.r - INT.top.l) * scale);
const interiorOffset = Math.round(INT.top.l * scale);
const cardFill = INT.top.colour;
console.log('card interior:', { interiorW, interiorOffset, cardFill, bottomFill: INT.bottom.colour });

/** Display type → PNG, exactly as the live pipeline bakes it. */
async function type(name, html, css, maxW = 560) {
  const page = await browser.newPage({ viewport: { width: maxW + 60, height: 400 }, deviceScaleFactor: 2 });
  await page.setContent(`<body style="margin:0;background:transparent"><style>${FONTS}${css}</style><div id="a" style="display:inline-block;max-width:${maxW}px">${html}</div></body>`);
  await page.evaluate(() => document.fonts.ready);
  const box = await page.locator('#a').boundingBox();
  await page.locator('#a').screenshot({ path: resolve(OUT, `${name}.png`), omitBackground: true });
  await page.close();
  return { file: `${name}.png`, w: Math.round(box.width), h: Math.round(box.height) };
}

/** Top edge with the card's own title composited on, so they cannot drift apart. */
async function cardTop() {
  const page = await browser.newPage({ viewport: { width: M.card.widthCss + 40, height: 400 }, deviceScaleFactor: 2 });
  await page.setContent(`<body style="margin:0;background:transparent"><style>${FONTS}</style>
    <div id="a" style="position:relative;width:${M.card.widthCss}px;line-height:0">
      <img src="data:image/png;base64,${readFileSync(resolve(OUT, M.card.top.file)).toString('base64')}" style="display:block;width:${M.card.widthCss}px">
      <div style="position:absolute;left:0;right:0;bottom:6px;text-align:center;font-family:Milenia;font-size:${L.cardTitle.size}px;line-height:1;color:${L.cardTitle.colour}">Your Cart</div>
    </div></body>`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#a').screenshot({ path: resolve(OUT, 'card-top-titled.png'), omitBackground: true });
  const box = await page.locator('#a').boundingBox();
  await page.close();
  return { file: 'card-top-titled.png', w: Math.round(box.width * 2), h: Math.round(box.height * 2) };
}
const topTitled = await cardTop();

const headline = await type('t-headline', COPY.headline,
  `#a{font-family:Milenia;font-size:${L.headline.size}px;line-height:${L.headline.lineHeight}px;color:${L.headline.colour};text-align:center;padding:4px 6px}`, 520);
const pillCart = await type('t-pill-cart', COPY.cta.label,
  `#a{font-family:Milenia;font-size:${L.pill.size}px;line-height:1;color:#fff;white-space:nowrap;padding:2px}`, 400);
const pillStory = await type('t-pill-story', 'Our Story',
  `#a{font-family:Milenia;font-size:${L.pill.size}px;line-height:1;color:#fff;white-space:nowrap;padding:2px}`, 400);

// ---------------------------------------------------------------- markup ----
const img = (a, w, alt = '', style = '') => `<img src="${asset(a.file || a)}" width="${w}" alt="${alt}" style="display:block;border:0;width:${w}px;max-width:${w}px;height:auto;${style}"/>`;
const pill = (t, href, label) => `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;"><tr>
<td align="center" bgcolor="${L.pill.bg}" style="background-color:${L.pill.bg};border-radius:${L.pill.radius}px;width:${L.pill.w}px;height:${L.pill.h}px;text-align:center;">
<a href="${href}" target="_blank" style="display:block;padding:${Math.round((L.pill.h - t.h / 2) / 2)}px 0;text-decoration:none;">${img(t, Math.round(t.w / 2), label, 'margin:0 auto;')}</a></td></tr></table>`;

const ITEM = `{% for item in event.extra.line_items %}<tr>
<td width="96" valign="top" style="padding:10px 14px 10px 0;"><img src="{% if item.product.variant.images.0.src %}{{ item.product.variant.images.0.src }}{% else %}{{ item.product.images.0.src|missing_product_image }}{% endif %}" width="96" alt="" style="display:block;width:96px;height:auto;border:0;border-radius:6px;"/></td>
<td valign="middle" style="padding:10px 0;font-family:${COND};">
<span style="font-size:18px;line-height:1.25;color:#1a1a1a;font-weight:bold;">{{ item.product.title }}</span><br/>
<span style="font-size:14px;letter-spacing:.5px;text-transform:uppercase;color:#6b6b60;">{{ item.variant_title }} &middot; Qty {{ item.quantity|floatformat:0 }}</span></td>
<td width="80" align="right" valign="middle" style="padding:10px 0;font-family:${COND};font-size:18px;font-weight:bold;color:#cc0000;white-space:nowrap;">{% currency_format item.line_price|floatformat:2 %}</td>
</tr>{% endfor %}`;

const CARD_W = M.card.widthCss;
const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${COPY.name}</title>
<style>
  body{margin:0;padding:0;background-color:${M.paper.colour};-webkit-text-size-adjust:100%;}
  img{border:0;line-height:100%;max-width:100%;}
  a{color:#cc0000;}
  @media (max-width:620px){ .ym-pad{padding-left:16px!important;padding-right:16px!important;} }
</style></head>
<body>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${M.paper.colour}" style="background-color:${M.paper.colour};">
<tr><td align="center" style="padding:0;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" background="${asset(M.paper.file)}" bgcolor="${M.paper.colour}" style="width:600px;max-width:600px;background-color:${M.paper.colour};background-image:url('${asset(M.paper.file)}');background-repeat:repeat-y;background-size:600px auto;">

  <tr><td align="center" style="padding:14px 0 6px;">${img(M.logo, M.logo.widthCss, 'Yard Microwaves')
    .replace('style="display:block;', 'style="display:inline-block;margin:0 auto;')}</td></tr>

  <tr><td align="center" class="ym-pad" style="padding:8px 30px 2px;">${img(headline, Math.round(headline.w / 2), COPY.headline, 'margin:0 auto;')}</td></tr>

  <tr><td align="center" class="ym-pad" style="padding:4px 40px 2px;font-family:${COND};font-size:${L.lede.size}px;line-height:1.15;letter-spacing:.5px;text-transform:uppercase;color:${L.lede.colour};font-weight:bold;">${COPY.lede}</td></tr>

  <tr><td align="center" class="ym-pad" style="padding:6px 40px 18px;font-family:${COND};font-size:${L.sub.size}px;line-height:1.2;letter-spacing:.3px;text-transform:uppercase;color:${L.sub.colour};font-weight:bold;">${COPY.body.split(/\\n\\s*\\n/)[0]}</td></tr>

  <tr><td align="center" style="padding:0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${CARD_W}" style="width:${CARD_W}px;">
      <tr><td align="left" style="padding:0 0 2px ${Math.max(0, interiorOffset - M.note.widthCss + 40)}px;line-height:0;font-size:0;">${img(M.note, M.note.widthCss, 'Before the next cookout')}</td></tr>
      <tr><td style="padding:0;line-height:0;font-size:0;">${img(topTitled, CARD_W, 'Your cart')}</td></tr>
      <tr><td style="padding:0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${interiorW}" align="center" bgcolor="${cardFill}" style="width:${interiorW}px;background-color:${cardFill};margin:0 auto;">
          <tr><td style="padding:0 18px 4px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">${ITEM}</table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0;line-height:0;font-size:0;">${img(M.card.bottom, CARD_W, '')}</td></tr>
    </table>
  </td></tr>

  <tr><td align="center" style="padding:26px 0 30px;">${pill(pillCart, '{{ event.extra.checkout_url }}', COPY.cta.label)}</td></tr>

  <tr><td align="center" background="${asset(M.footer.file)}" bgcolor="#141414" class="ym-pad" style="background-color:#141414;background-image:url('${asset(M.footer.file)}');background-size:cover;background-position:center top;padding:${Math.round(126 * 0.8)}px 30px 24px;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;"><tr><td align="center" width="470" style="width:470px;max-width:470px;font-family:${COND};font-size:${L.footerCopy.size}px;line-height:1.35;letter-spacing:.4px;text-transform:uppercase;color:#ffffff;font-weight:bold;text-shadow:0 1px 8px rgba(0,0,0,.8);">Welcome to Yard Microwaves, where childhood friends turned grillmasters add a satirical twist to BBQ, igniting unforgettable moments and mouthwatering flavors.</td></tr></table>
    <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>
    ${pill(pillStory, 'https://yardmicrowaves.com/pages/our-story', 'Our Story')}
    <div style="padding:22px 0 0;font-family:${COND};font-size:12px;line-height:1.7;color:#cbbfa2;">
      Yard Microwaves &middot; 24002 Via Fabricante #225, Mission Viejo, CA 92691<br/>
      You're getting this because you signed up at the Yard. &middot; <span style="color:#ffb563;">{% unsubscribe 'Unsubscribe' %}</span>
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

writeFileSync(resolve(OUT, 'cart1.html'), html);

// ---- render with sample data, the way Klaviyo would ------------------------
const SAMPLE = [
  { title: 'Rub & Plug Tee', variant: 'Bone / L', qty: 1, price: '$29.00', img: resolve(HERE, '..', 'build', 'assets', 'sample-rubplug.png') },
  { title: 'Smoke Signal Tee', variant: 'Briquette / M', qty: 1, price: '$29.00', img: resolve(HERE, '..', 'build', 'assets', 'sample-smokesig.png') },
];
const rows = SAMPLE.map((s) => `<tr>
<td width="96" valign="top" style="padding:10px 14px 10px 0;"><img src="file://${s.img}" width="96" alt="" style="display:block;width:96px;height:auto;border:0;border-radius:6px;"/></td>
<td valign="middle" style="padding:10px 0;font-family:${COND};"><span style="font-size:18px;line-height:1.25;color:#1a1a1a;font-weight:bold;">${s.title}</span><br/><span style="font-size:14px;letter-spacing:.5px;text-transform:uppercase;color:#6b6b60;">${s.variant} &middot; Qty ${s.qty}</span></td>
<td width="80" align="right" valign="middle" style="padding:10px 0;font-family:${COND};font-size:18px;font-weight:bold;color:#cc0000;white-space:nowrap;">${s.price}</td></tr>`).join('');
const preview = html.replace(ITEM, rows).replace(/\{\{ first_name[^}]*\}\}/g, 'Rich');
writeFileSync(resolve(OUT, 'cart1-preview.html'), preview);

const page = await browser.newPage({ viewport: { width: 640, height: 900 }, deviceScaleFactor: 2 });
await page.goto('file://' + resolve(OUT, 'cart1-preview.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: resolve(OUT, 'cart1.png'), fullPage: true });
const h = await page.evaluate(() => document.documentElement.scrollHeight);
await page.close();
await browser.close();
console.log(`cart1: ${Math.round(html.length / 1024)}KB html · rendered 600x${h}`);
