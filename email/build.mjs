#!/usr/bin/env node
/**
 * Build the 12 Klaviyo email templates as table-based HTML from one shared
 * skeleton. Reads assets.json (Klaviyo CDN urls written by `klaviyo.mjs
 * upload`) and writes build/templates/<slug>.html + index.json.
 *
 * Design language = the theme's landing page, section for section:
 *   header (The Shop / badge / Our Story) → Milenia headline → condensed
 *   uppercase olive lede → body copy → red Milenia pill → butcher-paper
 *   showcase / recipe card / quality band → torn edge → dark HOT LINKS footer.
 *
 * Templates are USER_DRAGGABLE: the copy sits in a Klaviyo region of text
 * blocks so it stays editable in the Klaviyo editor; the chrome is fixed HTML.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COPY } from './copy.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const A = JSON.parse(readFileSync(resolve(HERE, 'assets.json'), 'utf8'));
const OUT = resolve(HERE, 'build', 'templates');
mkdirSync(OUT, { recursive: true });

const img = (k) => { if (!A[k]) throw new Error(`asset not uploaded: ${k}`); return A[k]; };

// tokens (assets/ym-custom.css)
const OLIVE = '#918450', ORANGE = '#F16022', PEACH = '#FFB563', RED = '#FF0000', RED_DK = '#cc0000';
const DARK = '#1a1a1a', PAPER = '#ede4d3', INK = '#3B3229', CREAM = '#F0EEE2';
const COND = "'Arial Narrow','Helvetica Neue',Helvetica,Arial,sans-serif";
const BODY = "Arial,'Helvetica Neue',Helvetica,sans-serif";
const SITE = 'https://yardmicrowaves.com';
const IG = 'https://www.instagram.com/yardmicrowaves';
const FB = 'https://www.facebook.com/yardmicrowaves';
const TT = 'https://www.tiktok.com/@yardmicrowaves';

// ------------------------------------------------------------ components ----
const row = (inner, pad = '0 40px', extra = '') => `<tr><td align="center" class="ym-pad" style="padding:${pad};${extra}">${inner}</td></tr>`;

function picture(k, { w, alt = '', href = null, style = '' } = {}) {
  const a = img(k); const width = w || a.w;
  let t = `<img src="${a.url}" width="${width}" alt="${alt}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;${style}"/>`;
  if (href) t = `<a href="${href}" target="_blank" style="text-decoration:none;">${t}</a>`;
  return t;
}
const headline = (k, alt) => row(picture(`h-${k}`, { alt, style: 'margin:0 auto;' }), '18px 30px 4px');
const hero = (k = 'hero-smoker') => `<tr><td style="padding:0;line-height:0;font-size:0;">${picture(k, { w: 600, alt: 'Yard Microwaves' })}</td></tr>`;

/** Red pill (theme .ym-btn-red): HTML pill + Milenia label image, alt degrades to text. */
function button(k, href, alt) {
  const a = img(`b-${k}`);
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:10px auto 6px;"><tr>
<td align="center" bgcolor="${RED}" style="border-radius:20px;padding:13px 36px 15px;">
<a href="${href}" target="_blank" style="text-decoration:none;color:#ffffff;font-family:${BODY};font-size:18px;font-weight:bold;">
<img src="${a.url}" width="${a.w}" alt="${alt}" style="display:block;width:${a.w}px;max-width:${a.w}px;height:auto;border:0;"/></a></td></tr></table>`;
}
const cta = (k, href, alt) => row(button(k, href, alt), '2px 40px 12px');

const block = (html, style = '') => `<div class="klaviyo-block klaviyo-text-block" style="${style}">${html}</div>`;
const lede = (html) => block(html, `font-family:${COND};font-size:17px;line-height:1.45;letter-spacing:.8px;text-transform:uppercase;color:${OLIVE};text-align:center;padding:2px 0 12px;font-weight:bold;`);
const para = (html) => block(html, `font-family:${COND};font-size:18px;line-height:1.6;color:${INK};padding:0 0 12px;text-align:center;`);
const small = (html) => block(html, `font-family:${COND};font-size:14px;line-height:1.5;color:${INK};padding:0 0 10px;`);
/** Coupon callout — peach meat-counter ticket: filled, dark-red dashed edge. */
const coupon = (html) => block(`<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:6px auto 14px;"><tr><td align="center" bgcolor="${PEACH}" style="background-color:${PEACH};border:2px dashed ${RED_DK};border-radius:10px;padding:16px 28px;font-family:${COND};font-size:18px;line-height:1.45;letter-spacing:.8px;text-transform:uppercase;color:${INK};font-weight:bold;">${html}</td></tr></table>`, 'text-align:center;padding:0;');

/** Body copy. Plain klaviyo-block divs, deliberately NOT inside a
 *  data-klaviyo-region: Klaviyo rewrites region contents and strips the inline
 *  typography (verified: 12 styled blocks → 4 after render). */
const region = (blocks) => `<tr><td align="left" class="ym-pad" style="padding:10px 44px 4px;">${blocks.join('\n')}</td></tr>`;

const showcase = () => row(picture('showcase', { w: 600, alt: 'Rub & Plug and Smoke Signal tees — relaxed fit, crew neck, heavy weight', href: SITE }), '6px 0 0');
const quality = () => row(picture('quality-band', { w: 600, alt: 'Quality beyond compare. Preshrunk for perfection. Just like your brisket, our shirts exceed expectations. Guaranteed.' }), '4px 0 10px');
const freeship = () => row(picture('freeship', { w: 150, alt: 'Free shipping on $50+', style: 'margin:0 auto;' }), '0 0 6px');
const recipe = () => row(picture('recipe-card', { w: 600, alt: 'From our smoker to yours — secret ingredients in our shirts: relaxed fit, heavy weight 100% combed cotton, crew neck with ribbing, shoulder-to-shoulder tape, preshrunk, double needle hems' }), '6px 0 4px');
const storyBand = () => row(picture('story-band', { w: 600, alt: 'Welcome to Yard Microwaves, where childhood friends turned grillmasters add a satirical twist to BBQ, igniting unforgettable moments and mouthwatering flavors. Our Story', href: `${SITE}/pages/our-story` }), '10px 0 4px');
const signoff = (text = 'The Yard Microwaves Team') => row(`<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center"><tr>
<td valign="middle" style="padding-right:14px;">${picture('mascot', { w: 110, alt: '' })}</td>
<td valign="middle" style="font-family:${COND};font-size:15px;line-height:1.4;letter-spacing:.6px;text-transform:uppercase;color:${OLIVE};">Sincerely,<br/><strong>${text}</strong></td></tr></table>`, '4px 40px 14px');

/** Shopify line items (cart / order / shipping). priceExpr is a Klaviyo tag for the row price. */
function lineItems({ priceExpr, imageExpr, titleExpr, subExpr = '' }) {
  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
{% for item in event.extra.line_items %}
<tr>
<td width="96" valign="top" style="padding:8px 14px 8px 0;border-bottom:1px dashed ${OLIVE};">
<a href="{{ organization.url|trim_slash }}/products/{{ item.product.handle }}" target="_blank" style="display:block;"><img src="${imageExpr}" width="96" alt="" style="display:block;width:96px;height:auto;border:0;border-radius:4px;"/></a></td>
<td valign="middle" style="padding:8px 0;border-bottom:1px dashed ${OLIVE};font-family:${COND};font-size:16px;line-height:1.4;color:${INK};">
<a href="{{ organization.url|trim_slash }}/products/{{ item.product.handle }}" target="_blank" style="color:${INK};text-decoration:none;font-weight:bold;">${titleExpr}</a>${subExpr ? `<br/><span style="color:${OLIVE};font-size:14px;">${subExpr}</span>` : ''}<br/><span style="color:${OLIVE};font-size:14px;letter-spacing:.5px;text-transform:uppercase;">Qty {{ item.quantity|floatformat:0 }}</span></td>
<td width="80" align="right" valign="middle" style="padding:8px 0;border-bottom:1px dashed ${OLIVE};font-family:${COND};font-size:16px;color:${INK};white-space:nowrap;">${priceExpr}</td>
</tr>
{% endfor %}
</table>`;
}
const IMG_EXPR = `{% if item.product.variant.images.0.src %}{{ item.product.variant.images.0.src }}{% else %}{{ item.product.images.0.src|missing_product_image }}{% endif %}`;
const cartItems = () => row(`{% if event.extra.line_items %}${lineItems({ priceExpr: `{% currency_format item.line_price|floatformat:2 %}`, imageExpr: IMG_EXPR, titleExpr: '{{ item.product.title }}', subExpr: '{{ item.variant_title }}' })}{% endif %}`, '6px 44px 12px');

/** Cart as a butcher-counter order ticket: cream card, dashed edge, Marker
 *  header, 120px product shots, dark-red prices. The receipt look becomes a
 *  deliberate design object instead of a bare table. */
const cartTicket = ({ note = false } = {}) => row(`
${note ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="right" style="padding:0 26px 0 0;line-height:0;">${picture('note-still-warm', { alt: 'Still warm', style: 'display:inline-block;' })}</td></tr></table>` : ''}
<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" width="520" style="width:520px;max-width:100%;">
<tr><td bgcolor="${CREAM}" style="background-color:${CREAM};border:2px dashed ${OLIVE};border-radius:12px;padding:20px 24px 12px;">
<div style="text-align:center;padding-bottom:6px;">${picture('ticket-header', { alt: 'Your order ticket', style: 'margin:0 auto;display:inline-block;' })}</div>
{% if event.extra.line_items %}
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
{% for item in event.extra.line_items %}
<tr>
<td width="120" valign="top" style="padding:12px 16px 12px 0;{% if not forloop.first %}border-top:1px dashed ${OLIVE};{% endif %}">
<a href="{{ organization.url|trim_slash }}/products/{{ item.product.handle }}" target="_blank" style="display:block;"><img src="${IMG_EXPR}" width="120" alt="" style="display:block;width:120px;height:auto;border:0;border-radius:8px;"/></a></td>
<td valign="middle" style="padding:12px 0;font-family:${COND};{% if not forloop.first %}border-top:1px dashed ${OLIVE};{% endif %}">
<a href="{{ organization.url|trim_slash }}/products/{{ item.product.handle }}" target="_blank" style="color:${INK};text-decoration:none;font-weight:bold;font-size:20px;line-height:1.25;">{{ item.product.title }}</a><br/>
<span style="color:${OLIVE};font-size:15px;letter-spacing:.5px;text-transform:uppercase;">{{ item.variant_title }} &middot; Qty {{ item.quantity|floatformat:0 }}</span></td>
<td width="86" align="right" valign="middle" style="padding:12px 0;font-family:${COND};font-size:20px;font-weight:bold;color:${RED_DK};white-space:nowrap;{% if not forloop.first %}border-top:1px dashed ${OLIVE};{% endif %}">{% currency_format item.line_price|floatformat:2 %}</td>
</tr>
{% endfor %}
</table>
{% endif %}
</td></tr></table>`, '4px 40px 8px');
const orderItems = () => row(`{% if event.extra.line_items %}${lineItems({ priceExpr: `{% currency_format item.price|floatformat:2 %}`, imageExpr: IMG_EXPR, titleExpr: '{{ item.product.title }}', subExpr: '{{ item.variant_title }}' })}{% endif %}`, '6px 44px 4px');
const shipItems = () => row(`{% if event.extra.line_items %}${lineItems({ priceExpr: `{% currency_format item.price|floatformat:2 %}`, imageExpr: IMG_EXPR, titleExpr: '{{ item.name }}' })}{% endif %}`, '6px 44px 12px');

const totals = () => row(`<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right" style="font-family:${COND};font-size:16px;line-height:1.7;color:${INK};">
<tr><td style="padding-right:18px;color:${OLIVE};text-transform:uppercase;letter-spacing:.5px;">Subtotal</td><td align="right">{{ event.extra.subtotal_price }}</td></tr>
<tr><td style="padding-right:18px;color:${OLIVE};text-transform:uppercase;letter-spacing:.5px;">Shipping</td><td align="right">{{ event.extra.shipping_lines.0.price }}</td></tr>
<tr><td style="padding-right:18px;color:${OLIVE};text-transform:uppercase;letter-spacing:.5px;font-weight:bold;">Total</td><td align="right" style="font-weight:bold;">{{ event.extra.total_price|default:event.extra.subtotal_price }}</td></tr>
</table>`, '0 44px 12px');

const addressBlock = (label, p) => `<div style="font-family:${COND};font-size:14px;line-height:1.5;color:${INK};"><div style="color:${OLIVE};text-transform:uppercase;letter-spacing:.6px;font-size:13px;padding-bottom:3px;">${label}</div>
{{ event.extra.${p}.name|title }}<br/>{{ event.extra.${p}.address1 }}{% if event.extra.${p}.address2 %}, {{ event.extra.${p}.address2 }}{% endif %}<br/>{{ event.extra.${p}.city|title }}, {{ event.extra.${p}.province_code }} {{ event.extra.${p}.zip }}<br/>{{ event.extra.${p}.country }}</div>`;
const addresses = () => row(`<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
<td width="50%" valign="top" style="padding:8px 10px 8px 0;">${addressBlock('Billing address', 'billing_address')}</td>
<td width="50%" valign="top" style="padding:8px 0 8px 10px;">${addressBlock('Shipping address', 'shipping_address')}</td></tr></table>`, '0 44px 10px');

/** Viewed / reviewed product card. */
const productCard = ({ imgExpr, titleExpr, subExpr, href }) => row(`<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;"><tr>
<td align="center" style="padding:0 0 8px;"><a href="${href}" target="_blank" style="display:block;"><img src="${imgExpr}" width="240" alt="${titleExpr}" style="display:block;width:240px;max-width:100%;height:auto;border:0;border-radius:6px;"/></a></td></tr>
<tr><td align="center" style="font-family:${COND};font-size:19px;line-height:1.3;color:${INK};font-weight:bold;"><a href="${href}" target="_blank" style="color:${INK};text-decoration:none;">${titleExpr}</a></td></tr>
${subExpr ? `<tr><td align="center" style="font-family:${COND};font-size:15px;line-height:1.4;letter-spacing:.5px;text-transform:uppercase;color:${OLIVE};">${subExpr}</td></tr>` : ''}
</table>`, '6px 40px 10px');

/** 1–5 star rating row (each star links with ?rating=n). */
const stars = () => row(`<div style="font-family:${COND};font-size:17px;line-height:1.4;color:${INK};padding-bottom:8px;">How would you rate this item?</div>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center"><tr>${[1, 2, 3, 4, 5].map((n) =>
  `<td style="padding:0 4px;"><a href="{{ event.review_link }}?rating=${n}" target="_blank" style="display:block;">${picture('star', { w: 36, alt: `Rate it ${n} star${n > 1 ? 's' : ''}` })}</a></td>`).join('')}</tr></table>`, '4px 40px 16px');

/** 3-up "trending" grid from Klaviyo's Shopify product feed. */
const feedGrid = (title) => row(`{% if feeds.SHOP_POPULAR_ALL_CATEGORIES|index:0 %}<div style="font-family:${COND};font-size:15px;line-height:1.4;letter-spacing:.8px;text-transform:uppercase;color:${OLIVE};padding:0 0 12px;text-align:center;">${title}</div>
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr>${[0, 1, 2].map((i) => `
<td width="33%" valign="top" align="center" style="padding:0 6px;">{% if feeds.SHOP_POPULAR_ALL_CATEGORIES|index:${i} %}{% with item=feeds.SHOP_POPULAR_ALL_CATEGORIES|index:${i} %}
<a href="{{ item.url }}" target="_blank" style="display:block;text-decoration:none;"><img src="{{ item.image_full_url }}" width="160" alt="{{ item.title|safe }}" style="display:block;width:160px;max-width:100%;height:auto;border:0;border-radius:6px;margin:0 auto 8px;"/>
<div style="font-family:${COND};font-size:14px;line-height:1.3;color:${INK};font-weight:bold;">{{ item.title|safe }}</div>
<div style="font-family:${COND};font-size:14px;line-height:1.5;color:${OLIVE};">{{ item.price|default:'' }}</div></a>
{% endwith %}{% endif %}</td>`).join('')}</tr></table>{% endif %}`, '8px 30px 14px');

const SOCIALS = [
  ['instagram', 'Instagram', 'https://instagram.com/yardmicrowaves'],
  ['facebook', 'Facebook', 'https://facebook.com/yardmicrowaves'],
  ['tiktok', 'TikTok', 'https://tiktok.com/@yardmicrowaves'],
];

/** Footer: one full-bleed band. The paper tears away at the top to reveal the
 *  story photo, with the Our Story copy and pill sitting on it, then the small
 *  HOT LINKS chain (mirrors sections/ym-footer-cta.liquid) and the fine print
 *  (address + unsubscribe). The copy is LIVE TEXT, not a baked image — it
 *  ships in every email, so this keeps weight down and the text-to-image ratio
 *  sane. bgcolor is the fallback for clients that drop td background images.
 *
 *  Height budget: Outlook ignores background-size and TILES the 600x470 band,
 *  which would repeat the bright torn edge mid-footer. Keep this td's content
 *  under 470px — that is why the chain runs at 112px per link rather than its
 *  native 196px. Re-measure if anything is added here. */
const FOOTER_BAND_MIN_H = 470;
function footer() {
  const a = img('footer-band');
  // Guard the Outlook tiling trap: an older, shorter footer-band still has a
  // valid CDN url, so the build would silently ship a band that tiles and
  // repeats the bright torn edge mid-footer. Re-render + re-upload instead.
  if (a.h < FOOTER_BAND_MIN_H) {
    throw new Error(`footer-band is ${a.h}px tall, needs >= ${FOOTER_BAND_MIN_H}px — run: npm run assets && npm run upload`);
  }
  const band = a.url;
  const link = ([name, alt, href]) => `<td align="center" style="padding:0;line-height:0;font-size:0;">${picture(`hotlink-${name}`, { w: 112, alt, href })}</td>`;
  return `<tr><td align="center" background="${band}" bgcolor="#141414" class="ym-pad" style="background-color:#141414;background-image:url('${band}');background-size:cover;background-position:center top;padding:54px 30px 24px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;"><tr><td align="center" width="440" style="width:440px;max-width:440px;font-family:${COND};font-size:15px;line-height:1.5;letter-spacing:.8px;text-transform:uppercase;color:#ffffff;font-weight:bold;text-shadow:0 1px 8px rgba(0,0,0,.85);">Welcome to Yard Microwaves, where childhood friends turned grillmasters add a satirical twist to BBQ, igniting unforgettable moments and mouthwatering flavors.</td></tr></table>
${button('our-story', `${SITE}/pages/our-story`, 'Our Story')}
${picture('hotlinks-heading', { w: 112, alt: 'Hot Links', style: 'margin:14px auto 8px;' })}
<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 10px;"><tr>
${SOCIALS.map(link).join('\n')}
</tr></table>
<div class="ym-foot" style="font-family:${COND};font-size:12px;line-height:1.8;color:#CBBFA2;">
Yard Microwaves &middot; 24002 Via Fabricante #225, Mission Viejo, CA 92691<br/>
You're getting this because you signed up at the Yard. &middot; <span style="color:${PEACH};">{% unsubscribe 'Unsubscribe' %}</span>
</div></td></tr>`;
}

/** The Shop · badge · Our Story. Nav wordmarks stay inline so the td's align
 *  attribute still positions them in Outlook. */
function header() {
  const nav = (k, href, alt) => `<a href="${href}" target="_blank" style="text-decoration:none;">${picture(k, { alt, style: 'display:inline-block;' })}</a>`;
  return `<tr><td align="center" class="ym-pad" style="padding:20px 20px 6px;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width:100%;"><tr>
<td align="left" valign="middle" class="ym-nav" style="width:25%;">${nav('nav-shop', `${SITE}/collections/all`, 'The Shop')}</td>
<td align="center" valign="middle" class="ym-logo" style="width:50%;">${picture('badge-logo', { w: 176, alt: 'Yard Microwaves', href: SITE, style: 'margin:0 auto;' })}</td>
<td align="right" valign="middle" class="ym-nav" style="width:25%;">${nav('nav-story', `${SITE}/pages/our-story`, 'Our Story')}</td>
</tr></table></td></tr>`;
}

function page(rows) {
  const paper = img('paper-bg').url;
  return `<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title></title>
<style>
body { margin:0; padding:0; background-color:${PAPER}; -webkit-text-size-adjust:100%; }
img { border:0; line-height:100%; max-width:100%; }
a { color:${RED_DK}; }
p { margin:0 0 10px; }
ul { margin:0 0 10px; padding-left:22px; }
li { margin:0 0 4px; }
h3, h4 { font-family:${COND}; color:${OLIVE}; text-transform:uppercase; letter-spacing:.6px; font-size:17px; line-height:1.3; margin:4px 0 8px; }
table { border-collapse:collapse; }
.ym-foot a { color:${PEACH}; }
@media only screen and (max-width:620px) {
  .ym-container { width:100% !important; }
  .ym-pad { padding-left:16px !important; padding-right:16px !important; }
  .ym-nav img { width:66px !important; }
  .ym-logo img { width:140px !important; }
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${PAPER}" background="${paper}" style="background-color:${PAPER};background-image:url('${paper}');background-size:cover;background-position:center top;">
<tr><td align="center" style="padding:0;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="ym-container" style="width:600px;max-width:600px;">
${header()}
${rows.join('\n')}
${footer()}
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ------------------------------------------------------------- templates ----
// Copy comes from copy.mjs (Rich's picks). Each template = the shared chrome
// (header / footer from page()) + headline PNG + live-text lede/body +
// dynamic block + CTA pill + one or two brand bands.
const copyRows = (slug, { coupon: withCoupon = false } = {}) => {
  const c = COPY[slug];
  const blocks = [lede(c.lede)];
  if (c.body) blocks.push(para(c.body));
  if (withCoupon && c.coupon) blocks.push(coupon(`&#11088; ${c.coupon} &#11088;`));
  return [headline(slug, c.headline.replace(/<[^>]+>/g, '')), region(blocks)];
};
const ctaFor = (slug, href) => cta(COPY[slug].cta.key, href, COPY[slug].cta.label);
const REVIEW_PRODUCT = { imgExpr: '{{ event.structured_product.image_url }}', titleExpr: '{{ event.product.title }}', subExpr: '{{ event.structured_product.variant_name }}', href: '{{ event.review_link }}' };
const BROWSE_PRODUCT = { imgExpr: '{{ event.ImageURL }}', titleExpr: '{{ event.Name }}', subExpr: '{{ event.Price|striptags }}', href: '{{ event.URL }}' };

const TEMPLATES = {
  'welcome-1-new': [
    hero(),
    ...copyRows('welcome-1-new', { coupon: true }),
    ctaFor('welcome-1-new', '{{ organization.url }}'),
    showcase(),
    feedGrid('Trending items hand-picked just for you'),
    quality(),
  ],
  'welcome-1-existing': [
    hero(),
    ...copyRows('welcome-1-existing'),
    ctaFor('welcome-1-existing', '{{ organization.url }}'),
    showcase(),
    quality(),
  ],
  'welcome-2-follow': [
    ...copyRows('welcome-2-follow'),
    ctaFor('welcome-2-follow', IG),
    row(picture('story-collage', { w: 320, alt: 'Backyard pit shots from the Yard', href: IG, style: 'margin:0 auto;' }), '4px 40px 10px'),
    row(picture('pellets', { w: 90, alt: '', style: 'margin:0 auto;' }), '0 0 8px'),
    quality(),
  ],
  'review-request': [
    ...copyRows('review-request'),
    productCard(REVIEW_PRODUCT),
    stars(),
    ctaFor('review-request', '{{ event.review_link }}'),
    signoff(),
  ],
  'review-reminder': [
    ...copyRows('review-reminder'),
    productCard(REVIEW_PRODUCT),
    stars(),
    ctaFor('review-reminder', '{{ event.review_link }}'),
    signoff(),
  ],
  'shipping-confirmation': [
    ...copyRows('shipping-confirmation'),
    shipItems(),
    region([
      small(`<p style="margin:0;text-align:center;">Shipping {% if event.extra.fulfillments.0.tracking_company %}via {{ event.extra.fulfillments.0.tracking_company }} {% endif %}to {{ event.extra.shipping_address.first_name }} {{ event.extra.shipping_address.last_name }}, {{ event.extra.shipping_address.address1 }}, {{ event.extra.shipping_address.city }}, {{ event.extra.shipping_address.province_code }} {{ event.extra.shipping_address.zip }}.<br/>Tracking number <strong>{{ event.extra.fulfillments.0.tracking_number }}</strong>. Give it a day to start moving.</p>`),
    ]),
    ctaFor('shipping-confirmation', '{{ event.extra.fulfillments.0.tracking_url }}'),
    signoff(),
    recipe(),
  ],
  'order-confirmation': [
    ...copyRows('order-confirmation'),
    orderItems(),
    totals(),
    addresses(),
    ctaFor('order-confirmation', `{{ event.extra.order_status_url|default:organization.url }}`),
    signoff(),
    recipe(),
  ],
  'abandoned-cart-1': [
    ...copyRows('abandoned-cart-1'),
    cartTicket({ note: true }),
    ctaFor('abandoned-cart-1', '{{ event.extra.checkout_url }}'),
    freeship(),
    quality(),
  ],
  'abandoned-cart-2': [
    ...copyRows('abandoned-cart-2'),
    cartTicket(),
    ctaFor('abandoned-cart-2', '{{ event.extra.checkout_url }}'),
    showcase(),
    quality(),
  ],
  'abandoned-cart-3': [
    ...copyRows('abandoned-cart-3', { coupon: true }),
    cartTicket(),
    ctaFor('abandoned-cart-3', '{{ event.extra.checkout_url }}'),
    freeship(),
    quality(),
  ],
  'browse-abandonment-1': [
    ...copyRows('browse-abandonment-1'),
    productCard(BROWSE_PRODUCT),
    ctaFor('browse-abandonment-1', '{{ event.URL }}'),
    feedGrid('You might also like'),
    quality(),
  ],
  'browse-abandonment-2': [
    ...copyRows('browse-abandonment-2'),
    productCard(BROWSE_PRODUCT),
    ctaFor('browse-abandonment-2', '{{ event.URL }}'),
    showcase(),
    quality(),
  ],
};

// Campaigns (one-off sends) build from the same components once their copy is
// written in copy.json: hero, headline, lede/body, optional order-by cutoff
// line, CTA to the shop, tee showcase, quality band. No new art required.
for (const [slug, c] of Object.entries(COPY)) {
  if (!c.campaign) continue;
  TEMPLATES[slug] = [
    hero(),
    ...copyRows(slug),
    ...(c.cutoff ? [region([lede(c.cutoff)])] : []),
    ctaFor(slug, `${SITE}/collections/all`),
    showcase(),
    quality(),
  ];
}

// ------------------------------------------------------------------ build ----
const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&bull;|&middot;|&#11088;/g, ' ').replace(/&mdash;/g, '—').replace(/&ldquo;|&rdquo;/g, '"').replace(/\s+/g, ' ').trim();
/** Plain-text alternative, built from the copy rather than the HTML: slicing
 *  stripped HTML can cut a {% if %} / {% for %} in half, which makes Klaviyo
 *  refuse to render the whole template. */
const textVersion = (slug) => {
  const c = COPY[slug];
  return [
    'Yard Microwaves', '', c.headline, '',
    [c.lede, c.body, c.coupon].filter(Boolean).map(strip).join(' '), '',
    `${c.cta.label}: {{ organization.url }}`, '',
    "Yard Microwaves · 24002 Via Fabricante #225, Mission Viejo, CA 92691", "{% unsubscribe 'Unsubscribe' %}",
  ].join('\n');
};
const index = {};
for (const [slug, rows] of Object.entries(TEMPLATES)) {
  const c = COPY[slug];
  const html = page(rows);
  writeFileSync(resolve(OUT, `${slug}.html`), html);
  index[slug] = { name: c.campaign ? `Campaign - ${c.name}` : c.name, subject: c.subject, preheader: c.preheader, text: textVersion(slug) };
  console.log(`  ${slug.padEnd(24)} ${(html.length / 1024).toFixed(1)}KB`);
}
writeFileSync(resolve(OUT, 'index.json'), JSON.stringify(index, null, 1));
console.log(`build: ${Object.keys(index).length} templates → build/templates`);
