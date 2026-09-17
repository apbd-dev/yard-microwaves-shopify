/**
 * The approved copy for every Klaviyo message — loaded from copy.json, the ONE
 * source of truth. copy.json is plain text so it can be edited without touching
 * code: Rich edits the "Copy" tab of the YM Email Inventory sheet and
 * `node sheet.mjs pull` writes his edits into copy.json (see README.md).
 *
 * Tokens in copy.json → what they become here:
 *   {first name}     profile first name, "there" fallback
 *   {order #}        Shopify order number (bold inside lede/body)
 *   {coupon}         the discount code — still the INSERT-COUPON placeholder
 *                    until Rich creates the Shopify codes; never invent one
 *   {checkout link}, {tracking link}   SMS only
 * A blank line in a body starts a new paragraph.
 *
 *   headline  → rendered to a Milenia PNG by render-assets.mjs (h-<slug>)
 *   cta       → rendered to pill PNGs by render-assets.mjs (b-/pill-<key>)
 *   body/lede → live text in build.mjs
 *   subject / preheader / SMS body → flow message settings (klaviyo.mjs wire)
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const RAW = JSON.parse(readFileSync(resolve(HERE, 'copy.json'), 'utf8'));

export const FIRST = `{{ first_name|title|default:'there' }}`;
export const ORDER = `{{ event.extra.order_number }}`;
export const COUPON = 'INSERT-COUPON';

const esc = (s) => s.replace(/&(?!\w+;|#\d+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/—/g, '&mdash;').replace(/“/g, '&ldquo;').replace(/”/g, '&rdquo;');
/** Plain tokens → Klaviyo tags, for places that take text, not HTML (subject, preview, SMS). */
export const tags = (s = '') => s
  .split('{first name}').join(FIRST).split('{order #}').join(ORDER).split('{coupon}').join(COUPON)
  .split('{checkout link}').join('{{ event.extra.responsive_checkout_url }}')
  .split('{tracking link}').join('{{ event.extra.fulfillments.0.tracking_url }}');
/** Plain tokens → HTML for live text: escaped, order number and coupon bold. */
const html = (s = '') => esc(s)
  .split('{first name}').join(FIRST).split('{order #}').join(`<strong>${ORDER}</strong>`).split('{coupon}').join(`<strong>${COUPON}</strong>`);
const paragraphs = (s = '') => {
  const ps = s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return ps.map((p, i) => `<p${i === ps.length - 1 ? ' style="margin:0;"' : ''}>${html(p)}</p>`).join('');
};

const shape = (c) => ({
  ...c,
  subject: tags(c.subject), preheader: tags(c.preheader),
  lede: html(c.lede), body: c.body ? paragraphs(c.body) : undefined,
  coupon: c.coupon ? html(c.coupon) : undefined,
  cutoff: c.cutoff ? html(c.cutoff) : undefined,
});

/** A campaign builds once its copy is written; until then it is just rows on the sheet. */
const ready = (c) => Boolean(c.subject && c.headline && (c.lede || c.body) && c.cta?.label && c.cta?.key);

export const COPY = {
  ...Object.fromEntries(Object.entries(RAW.emails).map(([slug, c]) => [slug, shape(c)])),
  ...Object.fromEntries(Object.entries(RAW.campaigns || {}).filter(([, c]) => ready(c)).map(([slug, c]) => [slug, { ...shape(c), campaign: true }])),
};

/** SMS bodies with Klaviyo tags, keyed by sheet id (S01…). */
export const SMS = Object.fromEntries(Object.entries(RAW.sms || {}).map(([id, s]) => [id, { ...s, body: tags(s.body) }]));

/** Headline PNGs to render: slug → text (render-assets.mjs). */
export const HEADLINES = Object.fromEntries(Object.entries(COPY).map(([slug, c]) => [slug, c.headline]));

/** Button pills to render: key → label. Shared pills render once. */
export const BUTTONS = Object.fromEntries([
  ...Object.values(COPY).map((c) => [c.cta.key, c.cta.label]),
  ['our-story', 'Our Story'],   // footer
]);
