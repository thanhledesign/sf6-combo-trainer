#!/usr/bin/env node
// Probe a Capcom character page with Playwright to understand the DOM
// structure before building the production scraper. Dumps the rendered
// HTML for the data area to /tmp so we can inspect selectors.
//
// Run:  node scripts/sync/probe-capcom.mjs <character-id>
// e.g.: node scripts/sync/probe-capcom.mjs terry

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const characterId = process.argv[2] || 'terry';
const TARGETS = [
  { name: 'character', url: `https://www.streetfighter.com/6/character/${characterId}` },
  { name: 'movelist',  url: `https://www.streetfighter.com/6/character/${characterId}/movelist` },
  { name: 'frame',     url: `https://www.streetfighter.com/6/character/${characterId}/frame` },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
  viewport: { width: 1280, height: 900 },
});
const page = await ctx.newPage();

for (const t of TARGETS) {
  console.log(`\n=== ${t.name.toUpperCase()}: ${t.url} ===`);
  await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
  // Give react time to hydrate any deferred data
  await page.waitForTimeout(2000);

  const html = await page.content();
  const out = `/tmp/capcom-${characterId}-${t.name}.html`;
  writeFileSync(out, html);
  console.log(`  saved ${html.length.toLocaleString()} chars → ${out}`);

  // Quick selector probes specific to each page type
  if (t.name === 'frame') {
    const tables = await page.$$eval('table', (els) => els.length);
    const rows   = await page.$$eval('tr', (els) => els.length);
    const tbody  = await page.$$eval('tbody', (els) => els.length);
    console.log(`  selectors: ${tables} <table>, ${rows} <tr>, ${tbody} <tbody>`);
    // Sample first table's first row
    const sample = await page.evaluate(() => {
      const tr = document.querySelector('table tbody tr');
      return tr ? tr.outerHTML.slice(0, 800) : null;
    });
    if (sample) console.log(`  sample row:\n  ${sample.replace(/\n/g, '\n  ')}`);
  }
  if (t.name === 'character') {
    // Try to find profile / vitals area
    const headings = await page.$$eval('h1, h2, h3', (els) => els.slice(0, 10).map((e) => e.textContent.trim()));
    console.log(`  headings: ${JSON.stringify(headings)}`);
    const profileText = await page.evaluate(() => {
      // Grab text content of likely bio containers
      const candidates = ['[class*="profile"]', '[class*="character"]', '[class*="info"]'];
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el && el.textContent.length > 100) return { sel, snippet: el.textContent.slice(0, 400) };
      }
      return null;
    });
    if (profileText) console.log(`  bio-ish: ${profileText.sel} → "${profileText.snippet}"`);
  }
  if (t.name === 'movelist') {
    const moveCards = await page.$$eval('[class*="move"], [class*="command"]', (els) => els.length);
    console.log(`  selectors: ${moveCards} elements with "move"/"command" in class`);
  }
}

await browser.close();
console.log('\nDone. Inspect the saved HTML files for structure.');
