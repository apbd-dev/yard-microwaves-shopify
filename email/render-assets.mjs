#!/usr/bin/env node
/**
 * Render email-ready image assets from the theme's own files.
 *
 * Everything here is derived from ../assets (the Shopify theme): the badge
 * logo, the three brand fonts (Milenia / Bananas VF / Permanent Marker), the
 * butcher paper, torn edges, shirt mockups, mascot, sparkles, hot-links chain.
 * Email clients can't load web fonts, so headline / nav / button type is
 * rendered to PNG with the real fonts at 2x and served as images (with alt
 * text). Output: build/assets/*.png|jpg + build/assets/manifest.json.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const THEME_ASSETS = resolve(HERE, '..', 'assets');
const OUT = resolve(HERE, 'build', 'assets');
const TMP = resolve(HERE, 'build', 'tmp');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

// Theme tokens (assets/ym-custom.css :root)
export const C = {
  olive: '#918450', red: '#FF0000', redDark: '#cc0000', orange: '#F16022',
  peach: '#FFB563', cream: '#F0EEE2', dark: '#1a1a1a', darkSoft: '#2c2c2c',
  paper: '#ede4d3',
};

const b64 = (f) => readFileSync(resolve(THEME_ASSETS, f)).toString('base64');
const FONT_CSS = `
@font-face{font-family:'Milenia';src:url(data:font/woff2;base64,${b64('milenia.woff2')}) format('woff2');}
@font-face{font-family:'Bananas';src:url(data:font/woff2;base64,${b64('bananas-vf-regular.woff2')}) format('woff2');font-weight:100 900;}
@font-face{font-family:'BananasExp';src:url(data:font/woff2;base64,${b64('bananas-vf-bold-expanded.woff2')}) format('woff2');font-weight:100 900;}
@font-face{font-family:'Marker';src:url(data:font/woff2;base64,${b64('permanent-marker.woff2')}) format('woff2');}
`;
const asset = (f) => pathToFileURL(resolve(THEME_ASSETS, f)).href;
const logoSvg = readFileSync(resolve(THEME_ASSETS, 'ym-logo.svg'), 'utf8')
  .replace(/width="125" height="64"/, 'width="100%" height="auto"');

const manifest = {};
let browser, page;

/** Render `inner` inside a box of width w (height auto unless h) and screenshot it. */
async function shot(name, inner, css = '', { w = 600, h = null, jpg = false, quality = 82, scale = 2, bg = 'transparent' } = {}) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${FONT_CSS}
html,body{margin:0;padding:0;background:${bg};}
#s{position:relative;width:${w}px;${h ? `height:${h}px;` : ''}overflow:hidden;}
${css}
</style></head><body><div id="s">${inner}</div></body></html>`;
  const f = resolve(TMP, `${name}.html`);
  writeFileSync(f, html);
  await page.setViewportSize({ width: Math.max(w + 40, 320), height: Math.max((h || 400) + 40, 200) });
  await page.goto(pathToFileURL(f).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(80);
  const el = page.locator('#s');
  const box = await el.boundingBox();
  const file = resolve(OUT, `${name}.${jpg ? 'jpg' : 'png'}`);
  await el.screenshot({ path: file, omitBackground: !jpg, type: jpg ? 'jpeg' : 'png', quality: jpg ? quality : undefined, scale: 'css' });
  manifest[name] = { file: `${name}.${jpg ? 'jpg' : 'png'}`, w: Math.round(box.width), h: Math.round(box.height) };
  process.stdout.write(`  ${name.padEnd(22)} ${Math.round(box.width)}x${Math.round(box.height)}\n`);
}

/** Measure-then-render: type that should be exactly as wide as its content. */
async function typeShot(name, inner, css, { maxW = 560, jpg = false } = {}) {
  // render at maxW, measure the inner content, re-render tight
  const probe = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}html,body{margin:0}#m{display:inline-block;max-width:${maxW}px}${css}</style></head><body><div id="m">${inner}</div></body></html>`;
  const f = resolve(TMP, `${name}-probe.html`);
  writeFileSync(f, probe);
  await page.setViewportSize({ width: maxW + 40, height: 600 });
  await page.goto(pathToFileURL(f).href);
  await page.evaluate(() => document.fonts.ready);
  const box = await page.locator('#m').boundingBox();
  const w = Math.ceil(box.width) + 2;
  return shot(name, `<div style="display:inline-block;width:${w}px">${inner}</div>`, css, { w, jpg });
}

const HEADLINES = {
  'welcome-new':    'Welcome to the family!',
  'welcome-exist':  "Awesome! You're in!",
  'follow':         'Follow the smoke',
  'review-req':     'What did you think?',
  'review-rem':     "We'd love to hear from you",
  'shipping':       "It's on the way!",
  'order':          'Thank you for your order!',
  'cart-1':         "Don't let your items slip away!",
  'cart-2':         'Finish your order before it sells out',
  'browse':         'Well, what are you waiting for?',
};
const BUTTONS = {
  'shop-now': 'Shop Now',
  'back-to-cart': 'Back to my cart',
  'track-package': 'Track Your Package',
  'track-order': 'Track Your Order!',
  'follow-ig': 'Follow @yardmicrowaves',
  'leave-review': 'Leave a review',
  'our-story': 'Our Story',
};

async function main() {
  browser = await chromium.launch();
  page = await browser.newPage({ deviceScaleFactor: 2 });

  console.log('rendering theme assets → build/assets');

  // --- page texture (theme body background) ---------------------------------
  await shot('paper-bg', `<div style="width:600px;height:900px;background:${C.paper} url('${asset('ym-page-texture.jpg')}') center top / cover no-repeat"></div>`,
    '', { w: 600, h: 900, jpg: true, quality: 70 });

  // --- logos ----------------------------------------------------------------
  // Badge: the theme's cart-header treatment — orange rounded rect, rotated
  // -2°, white ticket logo on top (wordmark reads orange through the cutout).
  await shot('badge-logo', `<div style="display:inline-block;padding:10px 16px;background:${C.orange};border-radius:10px;transform:rotate(-2deg);margin:6px 8px;">
      <div style="width:150px;line-height:0">${logoSvg}</div></div>`, '', { w: 200 });
  await shot('logo-white', `<div style="width:170px;line-height:0;margin:2px">${logoSvg}</div>`, '', { w: 176 });

  // --- nav: "The SHOP" / "Our STORY" (Milenia + Bananas expanded, olive) ----
  const navCss = `.n{text-align:center;color:${C.olive};padding:2px 4px}.sm{font-family:Milenia;font-size:22px;line-height:1}.bg{font-family:BananasExp;font-weight:700;font-size:30px;line-height:.95;text-transform:uppercase;margin-top:-2px;letter-spacing:.02em}`;
  await typeShot('nav-shop', `<div class="n"><div class="sm">The</div><div class="bg">Shop</div></div>`, navCss);
  await typeShot('nav-story', `<div class="n"><div class="sm">Our</div><div class="bg">Story</div></div>`, navCss);

  // --- headlines (Milenia script, olive, like .ym-pioneers__title) ----------
  for (const [k, text] of Object.entries(HEADLINES)) {
    await typeShot(`h-${k}`, `<div class="t">${text}</div>`,
      `.t{font-family:Milenia;font-size:48px;line-height:1.08;color:${C.olive};text-align:center;padding:6px 10px}`, { maxW: 500 });
  }

  // --- button labels (Milenia white; pill is HTML so alt text degrades) -----
  for (const [k, text] of Object.entries(BUTTONS)) {
    await typeShot(`b-${k}`, `<div class="t">${text}</div>`,
      `.t{font-family:Milenia;font-size:26px;line-height:1;color:#fff;white-space:nowrap;padding:4px 2px}`);
  }
  // Full red pill as one image too (for clients that drop bgcolor on <td>)
  for (const [k, text] of Object.entries(BUTTONS)) {
    await typeShot(`pill-${k}`, `<div class="p">${text}</div>`,
      `.p{display:inline-block;font-family:Milenia;font-size:26px;line-height:1;color:#fff;white-space:nowrap;background:${C.red};border-radius:20px;padding:14px 40px 16px}`);
  }

  // --- hero: smoker still + white ticket logo + torn paper edge --------------
  await shot('hero-smoker', `
    <div style="position:absolute;inset:0;background:#111 url('${asset('ym-hero-smoker.png')}') center / cover no-repeat"></div>
    <div style="position:absolute;inset:0;background:rgba(0,0,0,.18)"></div>
    <div style="position:absolute;left:50%;top:46%;width:220px;transform:translate(-50%,-50%);line-height:0;filter:drop-shadow(0 3px 8px rgba(0,0,0,.5))">${logoSvg}</div>
    <img src="${asset('ym-torn-edge-merged.png')}" style="position:absolute;left:-2%;bottom:-6px;width:104%;height:auto;display:block">
  `, '', { w: 600, h: 330 });

  // --- product showcase: shirts on butcher paper with marker callouts --------
  await shot('showcase', `
    <img src="${asset('ym-butcher-paper.png')}" style="position:absolute;left:-70px;top:70px;width:720px;transform:rotate(-6deg)">
    <img src="${asset('ym-rubplug-back-full.png')}" style="position:absolute;left:10px;top:70px;width:340px;transform:rotate(-4deg);filter:drop-shadow(0 10px 18px rgba(0,0,0,.28))">
    <img src="${asset('ym-smokesig-back-full.png')}" style="position:absolute;left:280px;top:180px;width:330px;transform:rotate(4deg);filter:drop-shadow(0 10px 18px rgba(0,0,0,.28))">
    <img src="${asset('ym-sparkle-1.png')}" style="position:absolute;left:12px;top:6px;width:50px">
    <img src="${asset('ym-pellets-sm.png')}" style="position:absolute;left:20px;bottom:16px;width:56px">
    <div class="mk" style="left:392px;top:56px">Relaxed<br>fit</div>
    <svg class="ar" style="left:366px;top:82px" width="40" height="30" viewBox="0 0 40 30"><path d="M38 4 C28 2, 12 8, 4 24" fill="none" stroke="${C.olive}" stroke-width="2.5" stroke-linecap="round"/><path d="M2 16 L4 25 L13 23" fill="none" stroke="${C.olive}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="mk" style="left:508px;top:146px">Crew<br>neck</div>
    <svg class="ar" style="left:482px;top:172px" width="40" height="30" viewBox="0 0 40 30"><path d="M38 4 C28 2, 12 8, 4 24" fill="none" stroke="${C.olive}" stroke-width="2.5" stroke-linecap="round"/><path d="M2 16 L4 25 L13 23" fill="none" stroke="${C.olive}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="mk" style="left:132px;top:486px">Heavy<br>weight</div>
    <svg class="ar" style="left:196px;top:470px;transform:scaleX(-1) rotate(40deg)" width="40" height="30" viewBox="0 0 40 30"><path d="M38 4 C28 2, 12 8, 4 24" fill="none" stroke="${C.olive}" stroke-width="2.5" stroke-linecap="round"/><path d="M2 16 L4 25 L13 23" fill="none" stroke="${C.olive}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  `, `.mk{position:absolute;font-family:Marker;font-size:16px;line-height:1.05;text-transform:uppercase;color:${C.olive};text-align:center;text-shadow:0 0 6px ${C.paper},0 0 10px ${C.paper}}.ar{position:absolute;filter:drop-shadow(0 0 3px ${C.paper})}`,
  { w: 600, h: 580 });

  // --- quality banner band (sparkles + Bananas uppercase olive) --------------
  await shot('quality-band', `
    <img src="${asset('ym-sparkle-2.png')}" style="position:absolute;right:28px;top:-4px;width:44px">
    <img src="${asset('ym-pellets-sm.png')}" style="position:absolute;left:18px;bottom:-6px;width:40px">
    <div style="padding:26px 70px 22px;text-align:center;font-family:Bananas;font-weight:600;font-size:15px;line-height:1.45;letter-spacing:.05em;text-transform:uppercase;color:${C.olive}">
      Quality beyond compare. Preshrunk for perfection. Just like your brisket, our shirts exceed expectations. Guaranteed.
    </div>`, '', { w: 600 });

  // --- free-shipping sticker (starburst) ------------------------------------
  await shot('freeship', `
    <img src="${asset('ym-cart-starburst.png')}" style="position:absolute;inset:0;width:170px;height:170px">
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(-8deg);font-family:BananasExp;font-weight:700;font-size:17px;line-height:1.05;text-transform:uppercase;color:#fff;text-align:center;padding:0 26px">Free shipping on $50+</div>
  `, '', { w: 170, h: 170 });

  // --- recipe card (tagline section) with marker ingredients -----------------
  const ING = ['Relaxed fit', 'Heavy weight — 100% combed cotton', 'Crew neck with ribbing', 'Shoulder-to-shoulder tape', 'Preshrunk to minimize shrinkage', 'Double needle hems'];
  await shot('recipe-card', `
    <img src="${asset('ym-recipe-card.png')}" style="display:block;width:600px;height:auto">
    ${ING.map((t, i) => `<div class="ing" style="top:${72 + i * 24.2}px">${t}</div>`).join('')}
  `, `.ing{position:absolute;left:112px;font-family:Marker;font-size:14px;line-height:1;color:${C.olive};text-transform:uppercase;white-space:nowrap}`,
  { w: 600 });
  await shot('tagline-brisket', `<img src="${asset('ym-tagline-brisket.png')}" style="display:block;width:260px;height:auto">`, '', { w: 260 });

  // --- footer transition: paper tears away to reveal the dark footer ---------
  await shot('torn-to-dark', `
    <div style="position:absolute;left:0;right:0;top:44px;bottom:0;background:${C.dark}"></div>
    <img src="${asset('ym-torn-edge-merged.png')}" style="position:absolute;left:-2%;top:-2px;width:104%;display:block">
  `, '', { w: 600, h: 100 });

  // --- HOT LINKS heading + sausage chain split into three linkable thirds ---
  await typeShot('hotlinks-heading', `<div class="t">Hot Links</div>`,
    `.t{font-family:BananasExp;font-weight:700;font-size:34px;line-height:1;letter-spacing:.05em;text-transform:uppercase;color:${C.orange};padding:4px 6px}`);
  const chain = asset('ym-hot-links-chain.png');
  const socials = [['instagram', 'ym-icon-instagram.png', 0], ['facebook', 'ym-icon-facebook.png', 1], ['tiktok', 'ym-icon-tiktok.png', 2]];
  for (const [name, icon, i] of socials) {
    await shot(`hotlink-${name}`, `
      <img src="${chain}" style="position:absolute;left:${-i * 196}px;top:30px;width:588px;height:auto">
      <img src="${asset(icon)}" style="position:absolute;left:50%;top:38px;transform:translateX(-50%);height:22px;width:auto;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))">
    `, '', { w: 196, h: 100 });
  }

  // --- straight copies / simple crops ---------------------------------------
  copyFileSync(resolve(THEME_ASSETS, 'ym-mascot.png'), resolve(OUT, 'mascot.png'));
  manifest['mascot'] = { file: 'mascot.png', w: 250, h: 180 };
  await shot('story-collage', `<img src="${asset('ym-story-collage.png')}" style="display:block;width:320px;height:auto">`, '', { w: 320 });
  await shot('pioneers-photo', `<img src="${asset('ym-pioneers-photo.png')}" style="display:block;width:300px;height:auto">`, '', { w: 300 });
  await shot('pellets', `<img src="${asset('ym-pellets-cluster.png')}" style="display:block;width:110px;height:auto">`, '', { w: 110 });
  await shot('icon-smoke', `<img src="${asset('ym-icon-smoke.png')}" style="display:block;width:42px;height:auto">`, '', { w: 42 });
  // review star (orange, matches the starburst)
  await shot('star', `<svg width="40" height="40" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.3l-6 3.3 1.3-6.6L2.4 9.4l6.7-.8z" fill="${C.orange}" stroke="${C.redDark}" stroke-width=".6" stroke-linejoin="round"/></svg>`, '', { w: 40, h: 40 });

  writeFileSync(resolve(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
  await browser.close();
  console.log(`done: ${Object.keys(manifest).length} assets`);
}

main().catch((e) => { console.error(e); process.exit(1); });
