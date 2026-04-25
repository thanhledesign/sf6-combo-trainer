#!/usr/bin/env node
// Generate visual sitemap by visiting each route in production, taking
// mobile + desktop screenshots, and writing an HTML page that lays them
// out in a tree. The HTML has print-friendly CSS for 8.5x11 export.
//
// Run:  npm run sitemap
//
// Notes:
// - Uses production URL by default; pass --local to point at preview server
//   (must be running `npm run preview` separately).
// - Auto-handles the password gate (uses default 'shoryuken').
// - Modals are NOT screenshotted (they require interaction); see SITEMAP.md
//   for inventory.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'docs/sitemap-assets');
mkdirSync(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const local = args.includes('--local');
const BASE = local ? 'http://localhost:4173' : 'https://sf6-combo-trainer.vercel.app';
const PASSWORD = 'shoryuken';

const ROUTES = [
  { id: 'landing',         path: '/',                                title: 'Landing',                      group: 'root' },
  { id: 'browse-ken',      path: '/browse/ken',                      title: 'Browse — Ken',                 group: 'character' },
  { id: 'tactics-ken',     path: '/character/ken/tactics',           title: 'Tactics — Ken (with tags)',    group: 'character' },
  { id: 'tactics-terry',   path: '/character/terry/tactics',         title: 'Tactics — Terry (empty)',      group: 'character' },
  { id: 'tactics-pokes',   path: '/character/ken/tactics/pokes',     title: 'Tactics — Ken / Pokes',        group: 'character' },
  { id: 'punish-ken',      path: '/punish/ken',                      title: 'Punish Calculator — Ken',      group: 'character' },
  { id: 'tracker',         path: '/tracker',                         title: 'Tracker — main',               group: 'tracker' },
  { id: 'tracker-stats',   path: '/tracker/stats',                   title: 'Tracker — stats',              group: 'tracker' },
  { id: 'search',          path: '/search',                          title: 'Search',                       group: 'global' },
];

const VIEWPORTS = {
  mobile:  { width: 390, height: 844 },   // iPhone 13 Pro
  desktop: { width: 1280, height: 900 },
};

const browser = await chromium.launch({ headless: true });

async function captureViewport(viewportName, viewport) {
  const ctx = await browser.newContext({
    viewport,
    userAgent: 'Mozilla/5.0 (sitemap-generator)',
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  // Unlock the password gate by setting sessionStorage before any navigation
  await page.goto(BASE);
  await page.evaluate((pw) => {
    sessionStorage.setItem('sf6-trainer-password-ok', 'true');
  }, PASSWORD);

  for (const r of ROUTES) {
    const url = `${BASE}${r.path}`;
    process.stdout.write(`  ${viewportName.padEnd(8)} ${r.id} … `);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      // Give videos / lazy content a moment to settle
      await page.waitForTimeout(2000);
      const out = resolve(OUT_DIR, `${r.id}.${viewportName}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log('ok');
    } catch (e) {
      console.log(`failed: ${e.message}`);
    }
  }

  await ctx.close();
}

console.log(`Capturing sitemap from ${BASE}`);
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  await captureViewport(name, vp);
}
await browser.close();

// ─── Generate the HTML sitemap ─────────────────────────────────────────

const groupOrder = ['root', 'character', 'tracker', 'global'];
const groupLabels = {
  root:      'Landing',
  character: 'Per-character pages',
  tracker:   'Tracker (V01.32)',
  global:    'Cross-character',
};

const cardHtml = (r) => `
  <article class="card" id="${r.id}">
    <header>
      <h3>${r.title}</h3>
      <code>${r.path}</code>
    </header>
    <div class="shots">
      <figure>
        <img src="sitemap-assets/${r.id}.mobile.png" loading="lazy" alt="${r.title} mobile" />
        <figcaption>Mobile (390×844)</figcaption>
      </figure>
      <figure>
        <img src="sitemap-assets/${r.id}.desktop.png" loading="lazy" alt="${r.title} desktop" />
        <figcaption>Desktop (1280×900)</figcaption>
      </figure>
    </div>
    <a class="visit" href="${BASE}${r.path}" target="_blank" rel="noopener">Open in new tab ↗</a>
  </article>`;

const groupHtml = (group) => {
  const inGroup = ROUTES.filter((r) => r.group === group);
  if (!inGroup.length) return '';
  return `
    <section class="group">
      <h2>${groupLabels[group]}</h2>
      <div class="cards">
        ${inGroup.map(cardHtml).join('')}
      </div>
    </section>`;
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SF6 Trainer — Sitemap (${new Date().toISOString().slice(0,10)})</title>
<style>
  :root { color-scheme: dark; --bg:#111827; --card:#1f2937; --muted:#9ca3af; --accent:#a78bfa; --border:#374151; }
  * { box-sizing: border-box; }
  body { font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; margin: 0; background: var(--bg); color: #f3f4f6; padding: 24px; }
  header.top { max-width: 1200px; margin: 0 auto 24px; }
  header.top h1 { font-size: 28px; margin: 0 0 4px; color: white; }
  header.top p { color: var(--muted); margin: 0; font-size: 13px; }
  header.top a { color: var(--accent); text-decoration: none; }
  header.top a:hover { text-decoration: underline; }
  main { max-width: 1200px; margin: 0 auto; }
  section.group { margin-bottom: 32px; }
  section.group > h2 { font-size: 18px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border); color: white; letter-spacing: 0.02em; text-transform: uppercase; font-size: 12px; }
  .cards { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 900px) { .cards { grid-template-columns: 1fr 1fr; } }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
  .card header { margin-bottom: 12px; }
  .card h3 { margin: 0 0 4px; font-size: 16px; color: white; }
  .card code { font: 12px/1 ui-monospace, monospace; color: var(--accent); background: rgba(167,139,250,0.1); padding: 2px 6px; border-radius: 4px; }
  .shots { display: grid; grid-template-columns: minmax(0, 100px) minmax(0, 1fr); gap: 12px; }
  .shots figure { margin: 0; }
  .shots img { width: 100%; height: auto; display: block; border-radius: 6px; border: 1px solid var(--border); background: #000; }
  .shots figcaption { font-size: 10px; color: var(--muted); margin-top: 4px; text-align: center; }
  .visit { display: inline-block; margin-top: 12px; font-size: 12px; color: var(--accent); text-decoration: none; }
  .visit:hover { text-decoration: underline; }
  .toc { background: var(--card); border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .toc h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 0 0 8px; }
  .toc ul { list-style: none; padding: 0; margin: 0; columns: 2; column-gap: 24px; }
  .toc li { margin: 4px 0; font-size: 13px; }
  .toc a { color: white; text-decoration: none; }
  .toc a:hover { color: var(--accent); }
  .toc code { font: 11px/1 ui-monospace, monospace; color: var(--muted); }

  /* Print: 8.5x11, 1 page per group section, compact */
  @media print {
    body { background: white; color: #111; padding: 0; }
    header.top { color: #111; }
    header.top h1, .card h3 { color: #111; }
    header.top p, .card code, .toc code, .shots figcaption { color: #555; }
    main { max-width: none; }
    .toc { background: #f5f5f5; border: 1px solid #ddd; }
    .card { background: white; border: 1px solid #ccc; break-inside: avoid; page-break-inside: avoid; }
    .shots img { border: 1px solid #ccc; background: #fff; }
    section.group { break-after: page; }
    a.visit { display: none; }
    @page { size: letter; margin: 0.5in; }
  }
</style>
</head>
<body>
  <header class="top">
    <h1>SF6 Combo Trainer — Sitemap</h1>
    <p>V01.32 · Generated ${new Date().toISOString().slice(0,16).replace('T', ' ')} · <a href="${BASE}" target="_blank">${BASE}</a> · <a href="SITEMAP.md">Markdown outline</a></p>
  </header>
  <main>
    <nav class="toc">
      <h2>Quick jump</h2>
      <ul>
        ${ROUTES.map((r) => `<li><a href="#${r.id}">${r.title}</a> <code>${r.path}</code></li>`).join('')}
      </ul>
    </nav>
    ${groupOrder.map(groupHtml).join('')}
  </main>
</body>
</html>`;

writeFileSync(resolve(ROOT, 'docs/sitemap.html'), html);
console.log(`\nWrote docs/sitemap.html (open it in a browser, or print to PDF)`);
