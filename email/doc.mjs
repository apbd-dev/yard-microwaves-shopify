#!/usr/bin/env node
/**
 * ONE markdown file holds every word Yard Microwaves sends. Rich edits it in
 * Obsidian; this script carries it in and out of copy.json.
 *
 *   node doc.mjs push            # write the doc from copy.json (after a chat edit)
 *   node doc.mjs pull            # read the doc into copy.json (after he types)
 *   node doc.mjs pull --dry-run  # show what changed, write nothing
 *
 * The doc's path is in doc.json. Format, per message:
 *
 *   ## E01 · Welcome #1 — new subscriber
 *   _When it sends._
 *   **Subject:** …
 *   **Body:**
 *   paragraph one
 *
 *   paragraph two
 *
 * A `**Label:**` line is one field. Body runs until the next label or heading;
 * a blank line inside it is a paragraph break. Anything else in the file is
 * commentary and is ignored on the way back in.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(readFileSync(resolve(HERE, 'doc.json'), 'utf8'));
const DOC = CFG.doc.replace(/^~/, process.env.HOME);
const COPY_JSON = resolve(HERE, 'copy.json');
const load = () => JSON.parse(readFileSync(COPY_JSON, 'utf8'));

// label on the page → key in copy.json (+ the hint shown for an empty one)
const FIELDS = [
  ['Subject', 'subject', 'the inbox subject line'],
  ['Preview', 'preheader', 'the grey line after the subject'],
  ['Headline', 'headline', 'the big script headline, about 8 words'],
  ['Lede', 'lede', 'one line under the headline, shown in caps'],
  ['Body', 'body', 'the paragraphs'],
  ['Coupon line', 'coupon', 'the text on the peach ticket, keep {coupon}'],
  ['Order-by line', 'cutoff', 'the shipping cutoff line'],
  ['Button', 'cta.label', 'the button label'],
  ['Message', 'body', 'the text message'],
];
const KEY = Object.fromEntries(FIELDS.map(([l, k]) => [l, k]));
const HINT = Object.fromEntries(FIELDS.map(([l, , h]) => [l, h]));
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const set = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; };
const slugify = (s) => s.toLowerCase().replace(/%/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);

/** The reading order: the customer's journey, text messages beside their emails. */
const SECTIONS = [
  ['Welcome series', 'Fires when someone joins the Newsletter list.', [
    ['emails', 'welcome-1-new', 'Sends at once, to someone who has never bought'],
    ['emails', 'welcome-1-existing', 'Sends at once instead, to someone who has bought before'],
    ['emails', 'welcome-2-follow', 'Three days later, 11am'],
  ]],
  ['Abandoned cart', 'Fires when a checkout is started and not finished.', [
    ['sms', 'S01', 'After 4 hours, to phone subscribers instead of the first email'],
    ['emails', 'abandoned-cart-1', 'After 4 hours'],
    ['emails', 'abandoned-cart-2', 'After 24 hours'],
    ['emails', 'abandoned-cart-3', 'After 44 hours, with 15% off'],
  ]],
  ['Browse abandonment', 'Fires when someone looks at a tee and does not add it to the cart.', [
    ['emails', 'browse-abandonment-1', 'After 1 hour'],
    ['emails', 'browse-abandonment-2', 'An hour after that, the last one'],
  ]],
  ['Review request', 'Fires a few days after a tee is delivered.', [
    ['sms', 'S04', 'To phone subscribers instead of the first email'],
    ['emails', 'review-request', 'The ask'],
    ['emails', 'review-reminder', 'Seven days later, if there is still no review'],
  ]],
  ['Order confirmation', 'Fires the moment an order is placed.', [
    ['sms', 'S02', 'To phone subscribers, as well as the email'],
    ['emails', 'order-confirmation', 'The receipt'],
  ]],
  ['Shipping confirmation', 'Fires when the order ships.', [
    ['sms', 'S03', 'To phone subscribers, as well as the email'],
    ['emails', 'shipping-confirmation', 'The tracking email'],
  ]],
  ['Campaigns', 'One-off sends, written by hand and scheduled. Nothing here is written yet.', [
    ['campaigns', 'drop-announcement', 'Launch morning of a drop, to the whole list'],
    ['campaigns', 'finale', 'Launch morning of the Drop 5 finale'],
  ]],
];

/** Which labels a message shows, in order. */
function labelsFor(group, item, slug) {
  if (group === 'sms') return ['Message'];
  const order = ['Subject', 'Preview', 'Headline', 'Lede', 'Body', 'Coupon line', 'Order-by line', 'Button'];
  return order.filter((l) => {
    const k = KEY[l];
    if (k === 'cutoff') return slug === 'finale';
    if (k === 'coupon') return get(item, 'coupon') !== undefined || /10%|15%/.test(item.name || '');
    if (k === 'body') return true;
    return get(item, k) !== undefined || group === 'campaigns';
  });
}

// ------------------------------------------------------------------ push ----
function push() {
  const raw = load();
  const out = [];
  out.push('---', 'title: YM Email Copy', 'type: reference', 'domain: YM', 'workspace: yard-microwaves',
    `updated: ${new Date().toISOString().slice(0, 10)}`,
    'source: apbd-dev/yard-microwaves-shopify · email/copy.json',
    'tags: [content/email, brand/yard-microwaves, klaviyo]', '---', '');
  out.push('# YM Email Copy', '',
    'Every word Yard Microwaves sends. **Edit any line below, then tell Claude "sync the email copy".**',
    'The wording goes to Klaviyo: new headline and button art renders, the templates rebuild, and every flow message updates.', '',
    'Type inside the `**Label:**` lines. A blank line in a body starts a new paragraph. Leave these placeholders spelled exactly as they are, they fill themselves in when the email sends:', '',
    '`{first name}` · `{order #}` · `{coupon}` · `{checkout link}` · `{tracking link}`', '',
    'Two things to know. A **headline** is drawn as artwork in the script typeface, so it holds no placeholders and about eight words is the limit before it wraps to three lines. A **button** label is drawn the same way and holds about four words.', '',
    'Nothing here sends on its own. Every flow is still switched off in Klaviyo until you turn it on.', '');
  for (const [title, blurb, items] of SECTIONS) {
    out.push(`## ${title}`, '', `_${blurb}_`, '');
    for (const [group, slug, when] of items) {
      const item = raw[group][slug];
      if (!item) continue;
      const kind = group === 'sms' ? 'text message' : group === 'campaigns' ? 'campaign' : 'email';
      const id = item.id || slug;
      out.push(`### ${id} · ${item.name}`, '', `_${when} · ${kind}._`, '');
      for (const label of labelsFor(group, item, slug)) {
        const v = get(item, KEY[label]);
        if (label === 'Body' || label === 'Message') {
          out.push(`**${label}:**`, '');
          out.push(v ? v.trim() : `> ${HINT[label]} — write it here`, '');
        } else {
          out.push(`**${label}:** ${v || `<!-- ${HINT[label]} -->`}`);
        }
      }
      if (!out[out.length - 1].startsWith('**Body') && out[out.length - 1] !== '') out.push('');
    }
  }
  writeFileSync(DOC, out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n');
  console.log(`doc push: ${DOC}`);
}

// ------------------------------------------------------------------ pull ----
const LABEL = /^\*\*([A-Z][A-Za-z -]*):\*\*[ \t]*(.*)$/;
const HEADING = /^#{1,6}\s+(?:([EMSC]\d\d)\s*·\s*)?(.*)$/;

function parse(text) {
  const found = new Map();   // "E01|Subject" → value
  let id = null, label = null, buf = [];
  const flush = () => {
    if (id && label) {
      const v = buf.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      const clean = v.replace(/^>.*$/gm, '').replace(/<!--[\s\S]*?-->/g, '').trim();
      if (clean) found.set(`${id}|${label}`, clean);
    }
    label = null; buf = [];
  };
  for (const line of text.split('\n')) {
    const h = line.match(HEADING);
    if (h) { flush(); id = h[1] || null; continue; }
    const m = line.match(LABEL);
    if (m) { flush(); label = m[1]; if (m[2].trim()) buf.push(m[2]); continue; }
    if (label) buf.push(line);
  }
  flush();
  return found;
}

function pull() {
  const dry = process.argv.includes('--dry-run');
  if (!existsSync(DOC)) { console.error(`no doc at ${DOC} — run: node doc.mjs push`); process.exit(1); }
  const raw = load();
  const found = parse(readFileSync(DOC, 'utf8'));
  const index = new Map();   // id → [group, slug]
  for (const [, , items] of SECTIONS) for (const [group, slug] of items) { const it = raw[group]?.[slug]; if (it) index.set(it.id || slug, [group, slug]); }
  let changed = 0;
  for (const [k, next] of found) {
    const [id, label] = k.split('|');
    const where = index.get(id); const key = KEY[label];
    if (!where || !key) { console.log(`  ! ${id} ${label}: not a field I know — left alone`); continue; }
    const [group, slug] = where; const target = raw[group][slug];
    if ((label === 'Message') !== (group === 'sms')) { console.log(`  ! ${id} ${label}: that label belongs to a ${label === 'Message' ? 'text message' : 'email'} — left alone`); continue; }
    const cur = get(target, key);
    if (next === (cur || '').trim()) continue;
    if (key === 'headline' && /[{}]/.test(next)) { console.log(`  ! ${id} Headline: a headline is artwork, so it can't hold a placeholder — left alone`); continue; }
    console.log(`  ~ ${id} ${target.name} · ${label}\n      was: ${(cur || '(empty)').replace(/\n/g, ' / ')}\n      now: ${next.replace(/\n/g, ' / ')}`);
    set(target, key, next);
    if (key === 'cta.label') {
      const all = [...Object.values(raw.emails), ...Object.values(raw.campaigns || {})];
      const twin = all.find((c) => c !== target && c.cta?.label === next && c.cta?.key);
      target.cta.key = twin ? twin.cta.key : slugify(next);
    }
    changed++;
  }
  if (changed && !dry) writeFileSync(COPY_JSON, JSON.stringify(raw, null, 1) + '\n');
  console.log(`doc pull: ${changed} change${changed === 1 ? '' : 's'} ${dry ? 'found (dry run, nothing written)' : 'written to copy.json'}`);
}

const cmd = process.argv[2];
try {
  ({ push, pull }[cmd] || (() => { console.error('usage: doc.mjs push|pull [--dry-run]'); process.exit(2); }))();
} catch (e) { console.error(e.message || e); process.exit(1); }
