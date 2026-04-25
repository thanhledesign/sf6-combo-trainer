#!/usr/bin/env node
// Scrape canonical character data from streetfighter.com using Playwright.
// Writes per-character output to src/data/capcom/<id>.json.
//
// Run for one character:   node scripts/sync/scrape-capcom.mjs --char=terry
// Run for all defaults:    node scripts/sync/scrape-capcom.mjs --all
// Dry-run (write to /tmp):  node scripts/sync/scrape-capcom.mjs --char=terry --dry
//
// Source pages per character:
//   /6/character/<id>          — bio (height, weight, likes, hates, blurb, title)
//   /6/character/<id>/frame    — frame data table (parsed via DOM)
//   /6/character/<id>/movelist — currently unused (input notation is image-only)

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SRC_ANNOT = resolve(ROOT, 'src/data/annotations');
const OUT_CAPCOM = resolve(ROOT, 'src/data/capcom');

const DEFAULTS = ['ken', 'ryu', 'luke', 'chunli', 'cammy', 'mai', 'terry'];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const all = args.includes('--all');
const charArg = args.find((a) => a.startsWith('--char='))?.split('=')[1];
const characters = all ? DEFAULTS : (charArg ? [charArg] : DEFAULTS);

const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';

// ─── displayName → moveId fuzzy matcher ───────────────────────────────

function normalizeName(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function buildMoveIndex(annotMoves) {
  // Multi-key index: normalized fullName + normalized stripped (no SA prefix etc.)
  const byFull = new Map();
  const byStripped = new Map();
  const stripPrefix = (n) => n.replace(/^(?:sa[123]|ca|critical art)\s+/i, '').trim();
  for (const [id, move] of Object.entries(annotMoves)) {
    const dn = move?.displayName;
    if (!dn) continue;
    byFull.set(normalizeName(dn), id);
    byStripped.set(normalizeName(stripPrefix(dn)), id);
  }
  return { byFull, byStripped };
}

function matchMove(displayName, level, index, charId) {
  const norm = normalizeName(displayName);
  if (index.byFull.has(norm)) return index.byFull.get(norm);
  // Try without SA1/SA2/SA3/CA prefix
  const stripped = normalizeName(displayName.replace(/^(?:sa[123]|ca|critical art)\s+/i, '').trim());
  if (index.byStripped.has(stripped)) return index.byStripped.get(stripped);
  if (index.byFull.has(stripped)) return index.byFull.get(stripped);
  // Try common variants
  for (const cand of [
    norm.replace(/\bjumping\b/g, 'jump'),
    norm.replace(/\bjumping\b/g, 'neutral jumping'),
  ]) {
    if (index.byFull.has(cand)) return index.byFull.get(cand);
  }
  // Drive Reversal heuristic: "Drive Reversal (while blocking): Foo" → <char>_drive_reversal_block
  if (charId && /drive reversal.*blocking/i.test(displayName)) return `${charId}_drive_reversal_block`;
  if (charId && /drive reversal.*recovering/i.test(displayName)) return `${charId}_drive_reversal_wakeup`;
  return null;
}

// ─── Derived input notation for normals ───────────────────────────────

const STANCE = { 'standing': '5', 'crouching': '2', 'jumping': '9', 'neutral jumping': '8' };
const STRENGTH = { 'light': 'L', 'medium': 'M', 'heavy': 'H' };
const BUTTON = { 'punch': 'P', 'kick': 'K' };

function deriveNotationForNormal(displayName) {
  const lower = (displayName || '').toLowerCase();
  // Match patterns like "<stance> <strength> <button>" or "<stance> <button>"
  for (const [stKey, stVal] of Object.entries(STANCE)) {
    if (!lower.includes(stKey)) continue;
    for (const [stStrKey, stStrVal] of Object.entries(STRENGTH)) {
      for (const [btnKey, btnVal] of Object.entries(BUTTON)) {
        const pat = `${stKey} ${stStrKey} ${btnKey}`;
        if (lower.includes(pat)) {
          const input = `${stStrVal}${btnVal}`;
          return { input, notation: `${stVal}${input}`, shortName: `${stVal}${input}`, category: 'normal' };
        }
      }
    }
  }
  return null;
}

// ─── Scraping ─────────────────────────────────────────────────────────

async function scrapeCharacter(page, charId) {
  const out = {
    id: charId,
    scrapedAt: new Date().toISOString(),
    source: `https://www.streetfighter.com/6/character/${charId}`,
    character: {},
    moves: {},
    _unmatched: [],
  };

  // 1) Character bio page
  await page.goto(`https://www.streetfighter.com/6/character/${charId}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  out.character = await page.evaluate(() => {
    // Vitals: each label/value pair lives in a <li class="detail_info__item__…">
    // with two spans inside (title + text).
    const vitals = {};
    document.querySelectorAll('[class*="detail_info__item__"]').forEach((li) => {
      const label = li.querySelector('[class*="title"]')?.textContent.trim();
      const value = li.querySelector('[class*="text"]')?.textContent.trim();
      if (label && value) vitals[label.toLowerCase()] = value;
    });
    // Bio: longest <p> in the profile region
    const profile = document.querySelector('[class*="profile"]') || document.body;
    const ps = Array.from(profile.querySelectorAll('p'))
      .map((e) => e.textContent.trim())
      .filter((t) => t.length > 80);
    const bio = ps.sort((a, b) => b.length - a.length)[0] || null;
    return {
      bio,
      vitals: {
        height: vitals.height || null,
        weight: vitals.weight || null,
        likes:  vitals.likes  || null,
        hates:  vitals.hates  || null,
      },
    };
  });

  // 2) Frame data page
  await page.goto(`https://www.streetfighter.com/6/character/${charId}/frame`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Use the stable CSS class prefixes Capcom assigns per cell type
  // (e.g., frame_skill__xxx, frame_startup_frame__yyy) — robust to column
  // shuffles and module-hash changes.
  const rows = await page.evaluate(() => {
    const get = (tr, prefix) => {
      const el = tr.querySelector(`[class*="${prefix}"]`);
      return el ? el.textContent.trim() : null;
    };
    const trs = Array.from(document.querySelectorAll('table tbody tr'));
    let currentSection = null;
    const out = [];
    for (const tr of trs) {
      if (tr.className && /heading/i.test(tr.className)) {
        currentSection = tr.textContent.trim();
        continue;
      }
      const skill = tr.querySelector('[class*="frame_skill"]');
      if (!skill) continue;
      const displayName = skill.querySelector('[class*="frame_arts"]')?.textContent.trim() || null;
      const level = skill.querySelector('[class*="frame_classic"]')?.textContent.trim() || null;
      out.push({
        section: currentSection,
        displayName,
        level,
        startup:  get(tr, 'frame_startup_frame'),
        active:   get(tr, 'frame_active_frame'),
        recovery: get(tr, 'frame_recovery_frame'),
        onHit:    get(tr, 'frame_hit_frame'),
        onBlock:  get(tr, 'frame_block_frame'),
        cancel:   get(tr, 'frame_cancel'),
        damage:   get(tr, 'frame_damage'),
        hitLevel: get(tr, 'frame_attribute'),
        note:     get(tr, 'frame_note'),
      });
    }
    return out;
  });

  const SECTION_TO_CATEGORY = {
    'normal moves': 'normal',
    'unique moves': 'unique',
    'target combos': 'target_combo',
    'throws': 'throw',
    'special moves': 'special',
    'super arts': 'super',
  };

  const annot = JSON.parse(readFileSync(resolve(SRC_ANNOT, `${charId}.json`), 'utf8'));
  const index = buildMoveIndex(annot.moves);

  const num = (s) => {
    if (s == null || s === '') return null;
    const n = Number(String(s).replace(/^\+/, '').replace(/[^\d.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
  };

  for (const row of rows) {
    if (!row.displayName) continue;

    const startup = num(row.startup);
    const recovery = num(row.recovery);
    const onHit = num(row.onHit);
    const onBlock = num(row.onBlock);
    const damage = num(row.damage);

    let activeCount = null;
    if (row.active && row.active.includes('-')) {
      const [a, b] = row.active.split('-').map(Number);
      if (Number.isFinite(a) && Number.isFinite(b)) activeCount = b - a + 1;
    } else if (row.active) {
      const n = Number(row.active);
      if (Number.isFinite(n)) activeCount = n;
    }
    const total = startup != null && activeCount != null && recovery != null
      ? startup + activeCount + recovery
      : null;

    const moveId = matchMove(row.displayName, row.level, index, charId);
    if (!moveId) {
      out._unmatched.push({ displayName: row.displayName, section: row.section, level: row.level });
      continue;
    }

    const category = SECTION_TO_CATEGORY[row.section?.toLowerCase()] ?? 'normal';
    const derived = category === 'normal' ? deriveNotationForNormal(row.displayName) : null;
    const hitLevel = row.hitLevel ? row.hitLevel.toLowerCase().replace(/mid-air projectile/, 'mid-air-projectile') : null;

    out.moves[moveId] = {
      displayName: row.displayName,
      level: row.level,
      category,
      ...(derived && { input: derived.input, notation: derived.notation, shortName: derived.shortName }),
      damage,
      frameData: { startup, active: activeCount, activeRange: row.active, recovery, total },
      frameAdvantage: { onBlock, onHit },
      properties: {
        hitLevel,
        cancelable: row.cancel ? /C/.test(row.cancel) : false,
        ...(row.cancel && { cancelFlags: row.cancel }),
      },
      ...(row.note && { note: row.note }),
    };
  }

  return out;
}

// ─── Main ─────────────────────────────────────────────────────────────

(async () => {
  if (!existsSync(OUT_CAPCOM)) mkdirSync(OUT_CAPCOM, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: ua, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  for (const id of characters) {
    console.log(`\n→ Scraping ${id}…`);
    try {
      const data = await scrapeCharacter(page, id);
      const moveCount = Object.keys(data.moves).length;
      console.log(`  ${moveCount} moves matched, ${data._unmatched.length} unmatched`);
      if (data._unmatched.length) {
        console.log('  unmatched:', data._unmatched.slice(0, 5).map((u) => u.displayName).join(' | '), data._unmatched.length > 5 ? '…' : '');
      }
      const outPath = dryRun
        ? `/tmp/capcom-${id}.json`
        : resolve(OUT_CAPCOM, `${id}.json`);
      writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
      console.log(`  wrote ${outPath}`);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\nDone.');
})();
