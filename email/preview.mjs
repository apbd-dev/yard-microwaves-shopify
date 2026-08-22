#!/usr/bin/env node
/**
 * Screenshot the Klaviyo-rendered templates (build/rendered/*.html, from
 * `klaviyo.mjs render`) at desktop (640) and mobile (390) widths, plus one
 * contact sheet of every email → build/previews/.
 */
import { chromium } from 'playwright';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const IN = resolve(HERE, 'build', 'rendered');
const OUT = resolve(HERE, 'build', 'previews');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const files = readdirSync(IN).filter((f) => f.endsWith('.html')).sort();
const shots = [];
for (const f of files) {
  const slug = basename(f, '.html');
  for (const [tag, width] of [['desktop', 640], ['mobile', 390]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: tag === 'mobile' ? 2 : 1 });
    await page.goto(pathToFileURL(resolve(IN, f)).href, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const out = resolve(OUT, `${slug}-${tag}.png`);
    await page.screenshot({ path: out, fullPage: true });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`  ${slug}-${tag}  ${width}x${h}`);
    if (tag === 'desktop') shots.push({ slug, file: `${slug}-desktop.png`, h });
    await page.close();
  }
}
// contact sheet: all desktop renders side by side, scaled to 300px wide
const sheet = `<body style="margin:0;background:#333;padding:12px;font:12px monospace;color:#ddd;white-space:nowrap;">${shots.map((s) =>
  `<div style="display:inline-block;vertical-align:top;margin:0 8px 8px 0;width:300px;white-space:normal;"><div style="padding:4px 0;">${s.slug}</div><img src="${s.file}" style="width:300px;display:block;"></div>`).join('')}</body>`;
writeFileSync(resolve(OUT, '_sheet.html'), sheet);
const page = await browser.newPage({ viewport: { width: Math.min(shots.length, 6) * 316 + 24, height: 800 } });
await page.goto(pathToFileURL(resolve(OUT, '_sheet.html')).href, { waitUntil: 'networkidle' });
await page.screenshot({ path: resolve(OUT, 'contact-sheet.png'), fullPage: true });
await browser.close();
console.log(`preview: ${files.length} templates → build/previews (contact-sheet.png)`);
