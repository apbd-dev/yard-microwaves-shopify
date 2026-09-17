#!/usr/bin/env node
/**
 * The "Copy" tab of the YM Email Inventory Google Sheet ↔ copy.json.
 *
 *   node sheet.mjs push            # (re)write the Copy tab from copy.json; clears the edit column
 *   node sheet.mjs pull            # write Rich's edits (column E) into copy.json
 *   node sheet.mjs pull --dry-run  # show what would change, write nothing
 *
 * One row per piece of text. Column D is the current copy, column E is where
 * Rich types a replacement. `npm run copy:sync` runs the whole loop: pull →
 * render type → upload → build → push templates → wire flows → preview →
 * push the tab back (edits become the current copy).
 *
 * Talks to Google through the `gws` CLI (rich@deepseas.dev). Sheet id + tab
 * name live in sheet.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(readFileSync(resolve(HERE, 'sheet.json'), 'utf8'));
const COPY_JSON = resolve(HERE, 'copy.json');
const load = () => JSON.parse(readFileSync(COPY_JSON, 'utf8'));
const TAB = CFG.tab;

function gws(args) {
  const out = execFileSync('gws', args, { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 }).toString();
  return out.trim() ? JSON.parse(out.slice(out.indexOf('{'))) : {};
}
const P = (o) => JSON.stringify(o);

// field label on the sheet → [key in copy.json, guide max length, note]
const FIELDS = [
  ['Subject', 'subject', 50, 'Inbox subject line. Tokens allowed.'],
  ['Preview text', 'preheader', 90, 'Grey line after the subject in the inbox. Tokens allowed.'],
  ['Headline', 'headline', 48, 'Renders as the big script image. No tokens. About 8 words max or it wraps to 3 lines.'],
  ['Lede', 'lede', 90, 'Shown in UPPERCASE olive under the headline. Tokens allowed.'],
  ['Body', 'body', 320, 'Blank line = new paragraph. Tokens allowed.'],
  ['Coupon line', 'coupon', 90, 'Text on the peach ticket. Keep {coupon} where the code goes.'],
  ['Order-by cutoff line', 'cutoff', 90, 'Finale only. Shown in UPPERCASE under the body.'],
  ['Button label', 'cta.label', 24, 'Renders as script on the red pill.'],
];
const get = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const set = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] ??= {}), o); t[last] = v; };

/** Every editable piece of text, in sheet order. */
function entries(raw) {
  const out = [];
  const block = (group, slug, c, campaign) => {
    for (const [label, key, max, note] of FIELDS) {
      const has = get(c, key) !== undefined;
      if (!has && !(campaign && key !== 'coupon' && (key !== 'cutoff' || slug === 'finale'))) continue;
      if (key === 'cutoff' && slug !== 'finale') continue;
      out.push({ id: c.id, name: campaign ? `Campaign: ${c.name}` : c.name, label, group, slug, key, max, note, value: get(c, key) ?? '' });
    }
  };
  for (const [slug, c] of Object.entries(raw.emails)) block('emails', slug, c, false);
  for (const [id, s] of Object.entries(raw.sms || {})) out.push({ id, name: s.name, label: 'Message', group: 'sms', slug: id, key: 'body', max: 160, note: 'Text message. Tokens expand, so leave room: {checkout link}, {tracking link}, {order #}.', value: s.body });
  for (const [slug, c] of Object.entries(raw.campaigns || {})) block('campaigns', slug, c, true);
  return out;
}

const slugify = (s) => s.toLowerCase().replace(/%/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28);

// ------------------------------------------------------------------ push ----
function push() {
  const raw = load();
  const rows = entries(raw);
  const meta = gws(['sheets', 'spreadsheets', 'get', '--params', P({ spreadsheetId: CFG.spreadsheetId, fields: 'sheets(properties(sheetId,title))' })]);
  let sheetId = meta.sheets.find((s) => s.properties.title === TAB)?.properties.sheetId;
  if (sheetId === undefined) {
    const r = gws(['sheets', 'spreadsheets', 'batchUpdate', '--params', P({ spreadsheetId: CFG.spreadsheetId }), '--json', P({ requests: [{ addSheet: { properties: { title: TAB, index: 0, gridProperties: { rowCount: rows.length + 40, columnCount: 9, frozenRowCount: 1, frozenColumnCount: 3 } } } }] })]);
    sheetId = r.replies[0].addSheet.properties.sheetId;
  }
  const values = [['ID', 'Message', 'Field', 'Current copy', 'Your edit (type here)', 'Length', 'Guide max', 'Flag', 'Notes']];
  rows.forEach((e, i) => {
    const r = i + 2;
    values.push([e.id, e.name, e.label, e.value, '', `=LEN(IF(E${r}<>"",E${r},D${r}))`, e.max, `=IF(F${r}>G${r},"long","")`, e.note]);
  });
  gws(['sheets', 'spreadsheets', 'values', 'clear', '--params', P({ spreadsheetId: CFG.spreadsheetId, range: `${TAB}!A:I` }), '--json', '{}']);
  gws(['sheets', 'spreadsheets', 'values', 'update', '--params', P({ spreadsheetId: CFG.spreadsheetId, range: `${TAB}!A1`, valueInputOption: 'USER_ENTERED' }), '--json', P({ values })]);

  const n = values.length;
  const rng = (r0, r1, c0, c1) => ({ sheetId, startRowIndex: r0, endRowIndex: r1, startColumnIndex: c0, endColumnIndex: c1 });
  const rgb = (hex) => ({ red: parseInt(hex.slice(0, 2), 16) / 255, green: parseInt(hex.slice(2, 4), 16) / 255, blue: parseInt(hex.slice(4, 6), 16) / 255 });
  const widths = [50, 250, 130, 420, 420, 60, 75, 50, 380];
  // band the rows per message so each email reads as one block
  const bands = []; let shade = false; let start = 1;
  rows.forEach((e, i) => { const next = rows[i + 1]; if (!next || next.id !== e.id) { if (shade) bands.push([start, i + 2]); shade = !shade; start = i + 2; } });
  const requests = [
    { repeatCell: { range: rng(0, n + 40, 0, 9), cell: { userEnteredFormat: { backgroundColor: rgb('FFFFFF'), wrapStrategy: 'WRAP', verticalAlignment: 'TOP', textFormat: { fontFamily: 'Arial', fontSize: 10, bold: false, foregroundColor: rgb('222222') } } }, fields: 'userEnteredFormat(backgroundColor,wrapStrategy,verticalAlignment,textFormat)' } },
    ...bands.map(([a, b]) => ({ repeatCell: { range: rng(a, b, 0, 9), cell: { userEnteredFormat: { backgroundColor: rgb('F5F1E8') } }, fields: 'userEnteredFormat.backgroundColor' } })),
    { repeatCell: { range: rng(1, n, 4, 5), cell: { userEnteredFormat: { backgroundColor: rgb('FFF8C4') } }, fields: 'userEnteredFormat.backgroundColor' } },
    { repeatCell: { range: rng(0, 1, 0, 9), cell: { userEnteredFormat: { backgroundColor: rgb('3B3229'), textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: rgb('FFFFFF') } } }, fields: 'userEnteredFormat(backgroundColor,textFormat)' } },
    { repeatCell: { range: rng(1, n, 7, 8), cell: { userEnteredFormat: { textFormat: { fontFamily: 'Arial', fontSize: 10, bold: true, foregroundColor: rgb('CC0000') } } }, fields: 'userEnteredFormat.textFormat' } },
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1, frozenColumnCount: 3 } }, fields: 'gridProperties(frozenRowCount,frozenColumnCount)' } },
    ...widths.map((px, i) => ({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 }, properties: { pixelSize: px }, fields: 'pixelSize' } })),
  ];
  gws(['sheets', 'spreadsheets', 'batchUpdate', '--params', P({ spreadsheetId: CFG.spreadsheetId }), '--json', P({ requests })]);
  console.log(`sheet push: ${rows.length} copy rows → "${TAB}" tab  https://docs.google.com/spreadsheets/d/${CFG.spreadsheetId}/edit#gid=${sheetId}`);
}

// ------------------------------------------------------------------ pull ----
function pull() {
  const dry = process.argv.includes('--dry-run');
  const raw = load();
  const byKey = new Map(entries(raw).map((e) => [`${e.id}|${e.label}`, e]));
  const got = gws(['sheets', 'spreadsheets', 'values', 'get', '--params', P({ spreadsheetId: CFG.spreadsheetId, range: `${TAB}!A2:E` })]);
  let changed = 0;
  for (const row of got.values || []) {
    const [id, , label, , edit = ''] = row;
    const next = edit.replace(/\r\n/g, '\n').trim();
    if (!next) continue;
    const e = byKey.get(`${id}|${label}`);
    if (!e) { console.log(`  ! ${id} ${label}: no such field in copy.json — skipped`); continue; }
    if (next === (e.value || '').trim()) continue;
    if (e.key === 'headline' && /[{}]/.test(next)) { console.log(`  ! ${id} Headline: tokens cannot go in a headline (it is an image) — skipped`); continue; }
    const target = raw[e.group][e.slug];
    console.log(`  ~ ${id} ${e.name} · ${label}\n      - ${(e.value || '(empty)').replace(/\n/g, ' ⏎ ')}\n      + ${next.replace(/\n/g, ' ⏎ ')}`);
    set(target, e.key, next);
    if (e.key === 'cta.label') {
      // pills are images keyed by label: reuse a pill that already says this, else mint a key
      const all = [...Object.values(raw.emails), ...Object.values(raw.campaigns || {})];
      const twin = all.find((c) => c !== target && c.cta?.label === next && c.cta?.key);
      target.cta.key = twin ? twin.cta.key : slugify(next);
    }
    changed++;
  }
  if (changed && !dry) writeFileSync(COPY_JSON, JSON.stringify(raw, null, 1) + '\n');
  console.log(`sheet pull: ${changed} edit${changed === 1 ? '' : 's'} ${dry ? 'found (dry run, nothing written)' : 'written to copy.json'}`);
}

const cmd = process.argv[2];
try {
  ({ push, pull }[cmd] || (() => { console.error('usage: sheet.mjs push|pull [--dry-run]'); process.exit(2); }))();
} catch (e) { console.error(e.message || e); process.exit(1); }
