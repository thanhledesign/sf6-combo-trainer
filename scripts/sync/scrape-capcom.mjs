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

// ─── Image filename → notation token map ──────────────────────────────
// Capcom renders move inputs as a sequence of <img> tags inside a
// .movelist_classic span. Each filename maps to a notation token; we
// concatenate (skipping arrow_3 separators) to build the canonical input.
//
// Verified mappings:
//   Quick Dash   = [icon_kick, icon_kick]                → "KK"
//   Hadoken      = [key-d, key-dr, key-r, key-plus, icon_punch]   → "236P"
//   Shoryuken    = [key-r, key-d, key-dr, key-plus, icon_punch]   → "623P"
//   Tatsumaki    = [key-d, key-dl, key-l, key-plus, icon_kick]    → "214K"
//   Drive Parry  = [icon_punch_m, icon_kick_m]            → "MP+MK"

const IMG_TO_TOKEN = {
  // Numpad directions
  'key-d.png': '2',
  'key-dr.png': '3',
  'key-r.png': '6',
  'key-ur.png': '9',
  'key-u.png': '8',
  'key-ul.png': '7',
  'key-l.png': '4',
  'key-dl.png': '1',
  // Combinator
  'key-plus.png': '+',
  // Buttons (any-strength variants are how Capcom denotes "any P" / "any K")
  'icon_punch.png': 'P',
  'icon_kick.png': 'K',
  'icon_punch_l.png': 'LP',
  'icon_punch_m.png': 'MP',
  'icon_punch_h.png': 'HP',
  'icon_kick_l.png': 'LK',
  'icon_kick_m.png': 'MK',
  'icon_kick_h.png': 'HK',
  // Visual separator — drop
  'arrow_3.png': '',
};

function imagesToNotation(imgFilenames) {
  const raw = [];
  for (const fn of imgFilenames) {
    if (IMG_TO_TOKEN[fn] === '') continue;
    if (IMG_TO_TOKEN[fn] != null) raw.push(IMG_TO_TOKEN[fn]);
    else raw.push(`?${fn}?`); // surface unknown so we notice in diffs
  }
  // Drop the "+" tokens — Capcom uses key-plus to glue motion to button, but
  // standard SF notation doesn't write "236+P", it writes "236P". We re-insert
  // "+" only between two specific-strength buttons (HP+HK style).
  const tokens = raw.filter((t) => t !== '+');
  const isMotion = (t) => /^[1-9]$/.test(t);
  const isStrengthButton = (t) => /^[LMH][PK]$/.test(t);
  const isGenericButton = (t) => /^[PK]$/.test(t);

  const motion = [];
  const buttons = [];
  for (const t of tokens) {
    if (isMotion(t)) motion.push(t);
    else if (isStrengthButton(t) || isGenericButton(t)) buttons.push(t);
  }

  // Two specific-strength buttons (e.g. HP + HK = Drive Impact) → join with +
  // All other cases concatenate (236P, KK, MK, 5LP, etc.)
  const buttonStr = (buttons.length > 1 && buttons.every(isStrengthButton))
    ? buttons.join('+')
    : buttons.join('');
  return motion.join('') + buttonStr;
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

  // 1.5) Movelist page — extract canonical input notation from button-icon images
  await page.goto(`https://www.streetfighter.com/6/character/${charId}/movelist`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const movelistEntries = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('[class*="movelist_movelist_li"], [class*="movelist_li"]'));
    return items.map((li) => {
      const name = li.querySelector('[class*="movelist_arts"]')?.textContent.trim();
      const cmd  = li.querySelector('[class*="movelist_classic"]');
      if (!name || !cmd) return null;
      const imgs = Array.from(cmd.querySelectorAll('img'))
        .map((img) => (img.getAttribute('src') || '').split('/').pop())
        .filter((fn) => fn && (fn.startsWith('key-') || fn.startsWith('icon_') || fn.startsWith('arrow_')));
      return { name, imgs };
    }).filter(Boolean);
  });
  const notationByName = new Map();
  for (const e of movelistEntries) {
    notationByName.set(normalizeName(e.name), imagesToNotation(e.imgs));
  }

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

    // Canonical notation from movelist images takes precedence over the
    // displayName-derived form. For specials, this is the only source.
    // Frame page name often has prefixes/suffixes the movelist doesn't:
    //   "L Hadoken" → "Hadoken"
    //   "SA1 Dragonlash Flame" → "Dragonlash Flame"
    //   "OD Hadoken" → "Hadoken"
    //   "Drive Impact: Flame Strike" → "Drive Impact"
    const norm = normalizeName(row.displayName);
    const candidates = [
      norm,
      norm.replace(/^[lmh]\s+/, ''),
      norm.replace(/^(?:sa[123]|ca|od)\s+/, ''),
      norm.split(':')[0].trim(),
    ];
    let fromMovelist = null;
    for (const c of candidates) {
      if (notationByName.has(c)) { fromMovelist = notationByName.get(c); break; }
    }
    // Append strength suffix to generic-button notation (e.g. "236P" + L → "236LP").
    // Only when the frame-row level is exactly L/M/H — Capcom sometimes puts
    // hint text like "(when under 25% vitality)" or "(During a forward jump)"
    // in the level column for SA / aerial / conditional moves.
    if (fromMovelist && /^[LMH]$/.test(row.level || '') && /[PK]$/.test(fromMovelist) && !/[LMH][PK]$/.test(fromMovelist) && !fromMovelist.includes('+')) {
      fromMovelist = fromMovelist.replace(/([PK])$/, `${row.level}$1`);
    }
    const notation = fromMovelist || derived?.notation || null;
    const input = fromMovelist || derived?.input || null;

    out.moves[moveId] = {
      displayName: row.displayName,
      level: row.level,
      category,
      ...(notation && { input, notation, shortName: notation }),
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
