#!/usr/bin/env node
/**
 * Klaviyo side of the pipeline. Needs KLAVIYO_YM_API_KEY (private key with
 * images:write + templates:write) in the environment.
 *
 *   node klaviyo.mjs upload   # build/assets/* → Klaviyo image library → assets.json
 *   node klaviyo.mjs push     # build/templates/*.html → create/update templates → templates.json
 *   node klaviyo.mjs render   # render each pushed template with sample data → build/rendered/*.html
 *
 * Images are sent as base64 data URIs straight from disk (no third-party
 * host). Klaviyo has no image delete endpoint, so uploads are de-duplicated by
 * content hash: an unchanged file is never re-uploaded.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = process.env.KLAVIYO_YM_API_KEY;
if (!KEY) { console.error('KLAVIYO_YM_API_KEY is not set'); process.exit(2); }
const API = 'https://a.klaviyo.com/api';
const REV = '2025-07-15';
const PREFIX = 'YM Theme - ';          // template names; the older Figma-based set is "YM - …"
const ASSETS_JSON = resolve(HERE, 'assets.json');
const TEMPLATES_JSON = resolve(HERE, 'templates.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(method, path, body, attempt = 0) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Klaviyo-API-Key ${KEY}`, revision: REV, 'content-type': 'application/vnd.api+json', accept: 'application/vnd.api+json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 429 && attempt < 5) { await sleep(1500 * (attempt + 1)); return api(method, path, body, attempt + 1); }
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json.errors || json).slice(0, 600)}`);
  return json;
}
const loadJson = (f, d = {}) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d);
const sha = (buf) => createHash('sha1').update(buf).digest('hex').slice(0, 12);

// ---------------------------------------------------------------- upload ----
async function upload() {
  const dir = resolve(HERE, 'build', 'assets');
  const manifest = loadJson(resolve(dir, 'manifest.json'));
  const assets = loadJson(ASSETS_JSON);
  let uploaded = 0, skipped = 0;
  for (const [key, meta] of Object.entries(manifest)) {
    const buf = readFileSync(resolve(dir, meta.file));
    const hash = sha(buf);
    if (assets[key]?.hash === hash && assets[key]?.url) { skipped++; continue; }
    const mime = extname(meta.file) === '.jpg' ? 'image/jpeg' : 'image/png';
    const body = { data: { type: 'image', attributes: { name: `ym-email-${key}-${hash}`, import_from_url: `data:${mime};base64,${buf.toString('base64')}`, hidden: false } } };
    const r = await api('POST', '/images/', body);
    assets[key] = { url: r.data.attributes.image_url, id: r.data.id, hash, w: meta.w, h: meta.h, file: meta.file };
    uploaded++;
    console.log(`  ↑ ${key.padEnd(20)} ${(buf.length / 1024).toFixed(0).padStart(4)}KB  ${r.data.attributes.image_url}`);
    await sleep(350);
  }
  writeFileSync(ASSETS_JSON, JSON.stringify(assets, null, 1));
  console.log(`upload: ${uploaded} new, ${skipped} unchanged → assets.json`);
}

// ------------------------------------------------------------------ push ----
async function push() {
  const dir = resolve(HERE, 'build', 'templates');
  const index = loadJson(resolve(dir, 'index.json'));  // slug → {name, text}
  const state = loadJson(TEMPLATES_JSON);
  for (const [slug, meta] of Object.entries(index)) {
    const html = readFileSync(resolve(dir, `${slug}.html`), 'utf8');
    const name = PREFIX + meta.name;
    const attributes = { name, editor_type: 'USER_DRAGGABLE', html, text: meta.text || '' };
    const hash = sha(Buffer.from(html + name));
    if (state[slug]?.id) {
      if (state[slug].hash === hash) { console.log(`  = ${slug} unchanged (${state[slug].id})`); continue; }
      await api('PATCH', `/templates/${state[slug].id}/`, { data: { type: 'template', id: state[slug].id, attributes: { name, html, text: meta.text || '' } } });
      state[slug] = { ...state[slug], name, hash };
      console.log(`  ~ ${slug} updated  https://www.klaviyo.com/email-editor/${state[slug].id}/edit`);
    } else {
      const r = await api('POST', '/templates/', { data: { type: 'template', attributes } });
      state[slug] = { id: r.data.id, name, hash };
      console.log(`  + ${slug} created  https://www.klaviyo.com/email-editor/${r.data.id}/edit`);
    }
    await sleep(400);
  }
  writeFileSync(TEMPLATES_JSON, JSON.stringify(state, null, 1));
  console.log(`push: ${Object.keys(state).length} templates → templates.json`);
}

// ---------------------------------------------------------------- render ----
// Sample context so dynamic blocks (cart items, order, review product) show up.
const SAMPLE = {
  first_name: 'Rich',
  organization: { name: 'Yard Microwaves', url: 'https://yardmicrowaves.com' },
  event: {
    extra: {
      order_number: '#1042',
      checkout_url: 'https://yardmicrowaves.com/cart',
      subtotal_price: '$58.00', total_price: '$63.95',
      shipping_lines: [{ price: '$5.95' }],
      customer: { default_address: { first_name: 'Rich' } },
      billing_address: { name: 'Rich Ornelas', address1: '24002 Via Fabricante #225', city: 'Mission Viejo', province: 'CA', province_code: 'CA', zip: '92691', country: 'United States', first_name: 'Rich', last_name: 'Ornelas' },
      shipping_address: { name: 'Rich Ornelas', address1: '24002 Via Fabricante #225', city: 'Mission Viejo', province: 'CA', province_code: 'CA', zip: '92691', country: 'United States', first_name: 'Rich', last_name: 'Ornelas' },
      fulfillments: [{ tracking_company: 'USPS', tracking_number: '9400 1000 0000 0000 0000 00', tracking_url: 'https://tools.usps.com', line_items: [{ vendor: 'Yard Microwaves' }] }],
      line_items: [
        { name: 'Rub & Plug Tee - Bone / L', title: 'Rub & Plug Tee', quantity: 1, price: '29.00', line_price: '29.00', product: { title: 'Rub & Plug Tee', handle: 'rub-plug-t-shirt', images: [{ src: 'https://yardmicrowaves.com/cdn/shop/files/rubplug-front.png' }], variant: { title: 'Bone / L', images: [] } }, variant_title: 'Bone / L' },
        { name: 'Smoke Signal Tee - Briquette / M', title: 'Smoke Signal Tee', quantity: 1, price: '29.00', line_price: '29.00', product: { title: 'Smoke Signal Tee', handle: 'smoke-signals', images: [{ src: 'https://yardmicrowaves.com/cdn/shop/files/smokesig-front.png' }], variant: { title: 'Briquette / M', images: [] } }, variant_title: 'Briquette / M' },
      ],
    },
    ImageURL: 'https://yardmicrowaves.com/cdn/shop/files/rubplug-front.png', Name: 'Rub & Plug Tee', Price: '$29.00', URL: 'https://yardmicrowaves.com/products/rub-plug-t-shirt',
    product: { title: 'Rub & Plug Tee' },
    structured_product: { title: 'Rub & Plug Tee', image_url: 'https://yardmicrowaves.com/cdn/shop/files/rubplug-front.png', variant_name: 'Bone / L' },
    review_link: 'https://yardmicrowaves.com/reviews/new',
  },
};
async function render() {
  const state = loadJson(TEMPLATES_JSON);
  const out = resolve(HERE, 'build', 'rendered');
  mkdirSync(out, { recursive: true });
  for (const [slug, t] of Object.entries(state)) {
    const r = await api('POST', '/template-render/', { data: { type: 'template', id: t.id, attributes: { context: SAMPLE } } });
    writeFileSync(resolve(out, `${slug}.html`), r.data.attributes.html);
    console.log(`  rendered ${slug}`);
    await sleep(1100); // 60/min steady
  }
}

const cmd = process.argv[2];
({ upload, push, render }[cmd] || (() => { console.error('usage: klaviyo.mjs upload|push|render'); process.exit(2); }))()
  .catch((e) => { console.error(e.message || e); process.exit(1); });
