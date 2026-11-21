#!/usr/bin/env node
// Map every move in each character's Capcom movelist to its demo video URL, and
// optionally download the files into Supabase Storage (NOT the git repo).
//
//   node scripts/sync/scrape-videos.mjs                       # priority roster, manifest only
//   node scripts/sync/scrape-videos.mjs --chars=ken,ryu       # specific characters
//   node scripts/sync/scrape-videos.mjs --all                 # every character
//   node scripts/sync/scrape-videos.mjs --download            # also fetch files (see below)
//   node scripts/sync/scrape-videos.mjs --probe --chars=ken   # dump page HTML/network to debug selectors
//
// Output: src/data/videos/<char>.json  { moves: { <moveId>: { name, file, url, storageUrl? } } }
// The app reads this manifest (src/data/characters/loader.js) to attach `video` to each move.
//
// --download: with SUPABASE_SERVICE_KEY set, files upload to the `move-videos` bucket as
// <char>/<char>_<move_name>.<ext>; without it they are saved to ./video-out/ (git-ignored).
//
// NOTE: written against a guess at Capcom's markup (same class-prefix scheme the frame
// scraper uses). Run with --probe first if a character comes back empty.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { clipName, extractRows, matchVideos, publicUrl, uploadToStorage, BUCKET } from './lib/videos.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CAPCOM = resolve(ROOT, 'src/data/capcom');
const OUT = resolve(ROOT, 'src/data/videos');
const FILES = resolve(ROOT, 'video-out');

// Ken first, then the characters Ken meets most on the ladder (play-rate batches 1-2).
const PRIORITY = ['ken', 'ryu', 'luke', 'chunli', 'juri', 'cammy', 'terry', 'jamie', 'guile', 'manon', 'kimberly', 'marisa'];
const CAPCOM_URL = { akuma: 'gouki_akuma', bison: 'vega_mbison' };
const urlFor = (id) => CAPCOM_URL[id] || id;

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const arg = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const download = flag('download'), probe = flag('probe'), force = flag('force');
const chars = arg('chars') ? arg('chars').split(',') : flag('all')
  ? [...new Set([...PRIORITY, ...readdirSync(CAPCOM).map((f) => f.replace('.json', ''))])]
  : PRIORITY;

const VIDEO_RE = /https?:\/\/[^\s"'()<>]+?\.(?:mp4|webm|mov)(?:\?[^\s"'()<>]*)?/i;

async function scrapeMovelist(page, id, networkVideos) {
  await page.goto(`https://www.streetfighter.com/6/character/${urlFor(id)}/movelist`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  // Videos are often lazy-loaded: walk the page so every row enters the viewport.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1000);
  return page.evaluate(extractRows, VIDEO_RE.source);
}

async function fetchBuf(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.streetfighter.com/' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const networkVideos = [];
  page.on('response', (r) => { const ct = r.headers()['content-type'] || ''; if (/video\//.test(ct) || VIDEO_RE.test(r.url())) networkVideos.push(r.url()); });

  for (const id of chars) {
    console.log(`\n→ ${id}`);
    try {
      networkVideos.length = 0;
      const rows = await scrapeMovelist(page, id, networkVideos);
      const withUrl = rows.filter((r) => r.url);
      console.log(`  movelist rows: ${rows.length}, with video url: ${withUrl.length}, video network requests: ${networkVideos.length}`);
      if (probe) {
        mkdirSync(FILES, { recursive: true });
        writeFileSync(resolve(FILES, `probe-${id}.json`), JSON.stringify({ rows: rows.slice(0, 8), networkVideos: networkVideos.slice(0, 20) }, null, 2));
        console.log(`  wrote ${resolve(FILES, `probe-${id}.json`)}`);
        continue;
      }
      if (!withUrl.length) { console.error(`  SKIPPED ${id}: no video urls found (run with --probe)`); process.exitCode = 1; continue; }

      const capPath = resolve(CAPCOM, `${id}.json`);
      const capMoves = existsSync(capPath) ? JSON.parse(readFileSync(capPath, 'utf8')).moves : {};
      const { moves, unmatched, noVideo } = matchVideos(withUrl.map((r) => ({ name: r.name, url: r.url })), capMoves);

      const outPath = resolve(OUT, `${id}.json`);
      const prev = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { moves: {} };
      for (const [moveId, m] of Object.entries(moves)) {
        const ext = extname(new URL(m.url).pathname).slice(1) || 'mp4';
        m.file = clipName(id, m.name, ext);
        const old = prev.moves?.[moveId];
        if (old?.url === m.url && old.storageUrl) m.storageUrl = old.storageUrl; // already uploaded
      }

      if (download) {
        const done = new Map(); // url → storageUrl (variants share one file)
        for (const m of Object.values(moves)) {
          if (m.storageUrl && !force) continue;
          if (done.has(m.url)) { m.storageUrl = done.get(m.url); continue; }
          try {
            const buf = await fetchBuf(m.url);
            if (process.env.SUPABASE_SERVICE_KEY) {
              m.storageUrl = await uploadToStorage(`${id}/${m.file}`, buf, m.file.endsWith('webm') ? 'video/webm' : 'video/mp4');
            } else {
              mkdirSync(resolve(FILES, id), { recursive: true });
              writeFileSync(resolve(FILES, id, m.file), buf);
              console.log(`  saved ${id}/${m.file} (${(buf.length / 1024) | 0} KB)`);
            }
            done.set(m.url, m.storageUrl);
          } catch (e) { console.error(`  download failed for ${m.name}: ${e.message}`); }
        }
      }

      writeFileSync(outPath, JSON.stringify({
        id, scrapedAt: new Date().toISOString(), source: `https://www.streetfighter.com/6/character/${urlFor(id)}/movelist`,
        bucket: BUCKET, moves, _unmatchedVideos: unmatched.map((u) => u.name), _movesWithoutVideo: noVideo,
      }, null, 2) + '\n');
      console.log(`  linked ${Object.keys(moves).length} moves, ${unmatched.length} videos unmatched, ${noVideo.length} moves without video → ${outPath}`);
    } catch (e) { console.error(`  FAILED ${id}: ${e.message}`); process.exitCode = 1; }
  }
  await browser.close();
  console.log('\nDone.');
})();
