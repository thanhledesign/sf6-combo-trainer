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

// Local char id → Capcom URL slug, for chars where the names differ.
const CAPCOM_URL = {
  akuma: 'gouki_akuma',
  bison: 'vega_mbison',
};
const urlFor = (id) => CAPCOM_URL[id] || id;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const all = args.includes('--all');
const bootstrap = args.includes('--bootstrap');
const charArg = args.find((a) => a.startsWith('--char='))?.split('=')[1];
const characters = all ? DEFAULTS : (charArg ? [charArg] : DEFAULTS);

const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';

// ─── displayName → moveId fuzzy matcher ───────────────────────────────

function normalizeName(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Strip qualifiers people add to annotation displayNames in parens:
//   "Knee Strikes (Forward Throw)" → "Knee Strikes"
//   "Shoryuken (Quick Dash)"       → "Shoryuken"
//   "Kasai Thrust Kick (Kazekama)" → "Kasai Thrust Kick"
//   "Drive Impact (Power Blow)"    → "Drive Impact"
const stripAnnotQualifier = (n) => n.replace(/\s*\([^)]+\)\s*$/, '').trim();

// Strip prefixes Capcom uses on the frame page that aren't on the movelist
// or annotations: "L Hadoken" → "Hadoken", "SA1 X" → "X", "[Quick Dash] X" → "X"
const stripCapcomPrefix = (n) =>
  n.replace(/^\[(?:quick dash|after [^\]]+)\]\s+/i, '')
   .replace(/^(?:sa[123]|ca|od|critical art)\s+/i, '')
   .replace(/^[lmh]\s+/, '')
   .trim();

// Per-character disambiguation when Capcom puts the same displayName on
// multiple rows. Key format is "<normalized name>:<level token>" — level
// is either L/M/H or the parenthesized prerequisite text Capcom puts in
// the level column for chained moves.
const ID_BY_NAME_LEVEL = {
  // Ken's Kasai Thrust Kick — three rows, one per OD Jinrai sub-branch.
  // Capcom puts the prerequisite in the level column, not L/M/H.
  'kasai thrust kick:(during od kazekama shin kick)': 'ken_kasai_kazekama',
  'kasai thrust kick:(during od gorai axe kick)':     'ken_kasai_gorai',
  'kasai thrust kick:(during od senka snap kick)':    'ken_kasai_senka',
};

// Normalize the level field for hint-table lookup (lowercase, collapsed spaces).
const normLevelForHint = (lvl) => (lvl || '').toLowerCase().replace(/\s+/g, ' ').trim();

function buildMoveIndex(annotMoves) {
  const byFull = new Map();          // normalize(displayName)         → id
  const byStripped = new Map();       // strip SA/CA prefix             → id
  const byNoQualifier = new Map();    // strip "(Foo)" suffix           → id
  const noQualMulti = new Map();      // same key, but a list of ids when ambiguous
  for (const [id, move] of Object.entries(annotMoves)) {
    const dn = move?.displayName;
    if (!dn) continue;
    const full = normalizeName(dn);
    byFull.set(full, id);
    const noPrefix = normalizeName(dn.replace(/^(?:sa[123]|ca|critical art)\s+/i, '').trim());
    if (!byStripped.has(noPrefix)) byStripped.set(noPrefix, id);
    const noQual = normalizeName(stripAnnotQualifier(dn));
    if (!byNoQualifier.has(noQual)) byNoQualifier.set(noQual, id);
    if (!noQualMulti.has(noQual)) noQualMulti.set(noQual, []);
    noQualMulti.get(noQual).push(id);
  }
  return { byFull, byStripped, byNoQualifier, noQualMulti };
}

function matchMove(displayName, level, index, charId) {
  const norm = normalizeName(displayName);
  const cap  = normalizeName(stripCapcomPrefix(displayName));
  const both = normalizeName(stripAnnotQualifier(stripCapcomPrefix(displayName)));

  // 1. Exact match (Capcom name == annotation displayName)
  if (index.byFull.has(norm)) return index.byFull.get(norm);
  if (index.byFull.has(cap))  return index.byFull.get(cap);

  // 2. Stripped-qualifier match. Always try disambiguation FIRST when the
  //    stripped name is ambiguous (multiple annotation moves share it).
  const tryStripped = (key) => {
    const ids = index.noQualMulti.get(key);
    if (!ids || ids.length === 0) return null;
    if (ids.length > 1) {
      if (/^[LMH]$/.test(level || '')) {
        const hint = ID_BY_NAME_LEVEL[`${key}:${level}`];
        if (hint && ids.includes(hint)) return hint;
      }
      const pHint = ID_BY_NAME_LEVEL[`${key}:${normLevelForHint(level)}`];
      if (pHint && ids.includes(pHint)) return pHint;
    }
    return ids[0];
  };
  const m1 = tryStripped(norm); if (m1) return m1;
  const m2 = tryStripped(cap);  if (m2) return m2;
  const m3 = tryStripped(both); if (m3) return m3;

  // 3. Colon split (handles "Drive Impact: Flame Strike" → "Drive Impact")
  const beforeColon = normalizeName(displayName.split(':')[0].trim());
  if (index.byFull.has(beforeColon)) return index.byFull.get(beforeColon);
  const m4 = tryStripped(beforeColon); if (m4) return m4;

  // 4. SA prefix variant via byStripped
  if (index.byStripped.has(norm)) return index.byStripped.get(norm);

  // 5. Jumping → jump variants
  for (const cand of [norm.replace(/\bjumping\b/g, 'jump'), norm.replace(/\bjumping\b/g, 'neutral jumping')]) {
    if (index.byFull.has(cand)) return index.byFull.get(cand);
  }

  // 6. Drive Reversal heuristic
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
  // Charge motions (hold direction). Bracket notation like [4] / [2] is
  // standard for charge moves. Renderer translates to "(Hold ←)" / "(Hold ↓)".
  'key-lc.png': '[4]',
  'key-dc.png': '[2]',
  // Neutral position (5)
  'key-nutral.png': '5',
  // Alternation between options ("←/→ + P" style)
  'key-or.png': '/',
  // Modern controls "all directions" — semantically rare; drop
  'key-all.png': '',
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
  // Visual separators / unhandled — drop
  'arrow_3.png': '',
  '0.png': '',
  'dd.png': '~',  // double-tap indicator (e.g., Drive Rush "66")
  // Modern controls icons — drop (we describe Classic notation)
  'modern_m.png': '',
  's1.png': '',
  's2.png': '',
  's3.png': '',
  'd05.png': '',
  'd1.png': '',
  'd2.png': '',
  'd3.png': '',
};

function imagesToNotation(imgFilenames) {
  const raw = [];
  for (const fn of imgFilenames) {
    if (IMG_TO_TOKEN[fn] === '') continue;
    if (IMG_TO_TOKEN[fn] != null) raw.push(IMG_TO_TOKEN[fn]);
    else raw.push(`?${fn}?`); // surface unknown so we notice in diffs
  }
  // Drop the "+" tokens between motion and button — standard SF notation
  // doesn't write "236+P", just "236P". We re-insert "+" only between two
  // specific-strength buttons (HP+HK style).
  const tokens = raw.filter((t) => t !== '+');
  const isMotion = (t) => /^[1-9]$/.test(t);
  const isCharge = (t) => /^\[[1-9]\]$/.test(t);
  const isStrengthButton = (t) => /^[LMH][PK]$/.test(t);
  const isGenericButton = (t) => /^[PK]$/.test(t);

  const motion = [];
  const buttons = [];
  for (const t of tokens) {
    if (isMotion(t) || isCharge(t)) motion.push(t);
    else if (isStrengthButton(t) || isGenericButton(t)) buttons.push(t);
    else motion.push(t); // pass-through for "/", "~", etc.
  }

  // Decide button representation:
  // - Identical generic buttons (K+K, P+P) → "KK" / "PP" (Quick Dash style)
  // - 2 specific buttons of DIFFERENT families (HP + HK) → "HP+HK" (Drive Impact)
  // - 1 generic + 1 specific of SAME family (K + HK) → keep the generic
  //   (Capcom shows this as "regular K, OD HK" — only the generic applies
  //   to the regular variant; the OD lives on its own frame row.)
  // - 1 button → use it
  // - >2 buttons → concat (rare, multi-tap moves)
  let buttonStr;
  if (buttons.length === 2) {
    const [a, b] = buttons;
    const famA = a.slice(-1);
    const famB = b.slice(-1);
    if (a === b) {
      // identical generics: real two-button input
      buttonStr = a + b;
    } else if (famA === famB && (isGenericButton(a) || isGenericButton(b))) {
      // generic + specific of same family: keep generic only
      buttonStr = isGenericButton(a) ? a : b;
    } else if (famA !== famB && isStrengthButton(a) && isStrengthButton(b)) {
      // different families, both specific: simultaneous press
      buttonStr = `${a}+${b}`;
    } else {
      buttonStr = buttons.join('');
    }
  } else {
    buttonStr = buttons.join('');
  }
  return motion.join('') + buttonStr;
}

// ─── Numpad → arrow display form ──────────────────────────────────────
// "236LP"   → "↓↘→ + LP"
// "623P"    → "→↓↘ + P"
// "KK"      → "K + K"
// "HP+HK"   → "HP + HK"
// "5LP"     → "LP"        (neutral stance dropped)
// "2MK"     → "↓ + MK"
// Optional context prefix prepends to the result with a leading space.

const NUMPAD_TO_ARROW = {
  '1': '↙', '2': '↓', '3': '↘',
  '4': '←',           '6': '→',
  '7': '↖', '8': '↑', '9': '↗',
};

function notationToInputDisplay(notation, context = null) {
  if (!notation) return null;

  const formatPart = (p) => {
    // Charge prefix: [4]6P → "(Hold ←) → + P"
    const chargeMatch = p.match(/^\[([1-9])\]([1-9]*)(.*)$/);
    if (chargeMatch) {
      const chargeArrow = NUMPAD_TO_ARROW[chargeMatch[1]] || chargeMatch[1];
      const followMotion = chargeMatch[2];
      const button = chargeMatch[3];
      const followArrows = followMotion.split('').map((d) => NUMPAD_TO_ARROW[d] || d).join('');
      let s = `(Hold ${chargeArrow})`;
      if (followArrows) s += ` ${followArrows}`;
      if (button) s += ` + ${button}`;
      return s;
    }
    // Motion + button: 236P → "↓↘→ + P"
    const m = p.match(/^([1-9]+)(.*)$/);
    if (!m) return p; // pure-button like "K" or "LP"
    const motion = m[1];
    const button = m[2];
    if (motion === '5') return button; // drop neutral stance
    const arrows = motion.split('').map((d) => NUMPAD_TO_ARROW[d] || d).join('');
    return button ? `${arrows} + ${button}` : arrows;
  };

  // Split on existing "+" first (HP+HK style)
  const parts = notation.split('+').map((p) => p.trim());

  let display;
  if (parts.length > 1) {
    display = parts.map(formatPart).join(' + ');
  } else if (/^[LMH]?[PK][LMH]?[PK]$/.test(notation)) {
    // Generic two-button concat (KK, PP, LPLK)
    const m = notation.match(/^([LMH]?[PK])([LMH]?[PK])$/);
    if (m) display = `${m[1]} + ${m[2]}`;
    else display = formatPart(notation);
  } else {
    display = formatPart(notation);
  }

  return context ? `${context} ${display}` : display;
}

// ─── Scraping ─────────────────────────────────────────────────────────

async function scrapeCharacter(page, charId) {
  const out = {
    id: charId,
    scrapedAt: new Date().toISOString(),
    source: `https://www.streetfighter.com/6/character/${urlFor(charId)}`,
    character: {},
    moves: {},
    _unmatched: [],
  };

  // 1) Character bio page
  await page.goto(`https://www.streetfighter.com/6/character/${urlFor(charId)}`, { waitUntil: 'networkidle', timeout: 60000 });
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
  await page.goto(`https://www.streetfighter.com/6/character/${urlFor(charId)}/movelist`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const movelistEntries = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('li[class*="movelist"]'));
    return items.map((li) => {
      const name = li.querySelector('[class*="movelist_arts"]')?.textContent.trim();
      const cmd  = li.querySelector('[class*="movelist_classic"]');
      if (!name || !cmd) return null;
      const imgs = Array.from(cmd.querySelectorAll('img'))
        .map((img) => (img.getAttribute('src') || '').split('/').pop())
        .filter((fn) => fn && (fn.startsWith('key-') || fn.startsWith('icon_') || fn.startsWith('arrow_')));
      // Conditional context like "(During Jinrai Kick)" lives in skill_text
      // siblings near the movelist_classic span.
      const skill = li.querySelector('[class*="skill_text"]');
      // Normalize Capcom's fullwidth parens / spaces to ASCII for consistency
      const context = skill
        ? skill.textContent.trim()
            .replace(/[（]/g, '(').replace(/[）]/g, ')')
            .replace(/[　]/g, ' ')
            .replace(/\s+/g, ' ')
        : null;
      return { name, imgs, context };
    }).filter(Boolean);
  });
  const notationByName = new Map();
  const contextByName  = new Map();
  for (const e of movelistEntries) {
    const key = normalizeName(e.name);
    notationByName.set(key, imagesToNotation(e.imgs));
    if (e.context) contextByName.set(key, e.context);
  }

  // 2) Frame data page
  await page.goto(`https://www.streetfighter.com/6/character/${urlFor(charId)}/frame`, { waitUntil: 'networkidle', timeout: 60000 });
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

  const annotPath = resolve(SRC_ANNOT, `${charId}.json`);
  const annot = existsSync(annotPath)
    ? JSON.parse(readFileSync(annotPath, 'utf8'))
    : { moves: {}, character: null, tactics: {} };
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

    let moveId = matchMove(row.displayName, row.level, index, charId);
    if (!moveId) {
      if (bootstrap) {
        // For new characters that don't yet have annotations, derive a stable
        // moveId from the Capcom display name + level. Skeletal annotations
        // get generated alongside (see writer below).
        const slug = `${charId}_${normalizeName(row.displayName).replace(/\s+/g, '_')}`;
        const lvlSuffix = /^[LMH]$/.test(row.level || '') ? `_${row.level.toLowerCase()}` : '';
        moveId = (slug + lvlSuffix).replace(/__+/g, '_').replace(/_+$/, '');
      } else {
        out._unmatched.push({ displayName: row.displayName, section: row.section, level: row.level });
        continue;
      }
    }

    const category = SECTION_TO_CATEGORY[row.section?.toLowerCase()] ?? 'normal';
    const derived = category === 'normal' ? deriveNotationForNormal(row.displayName) : null;
    const hitLevel = row.hitLevel ? row.hitLevel.toLowerCase().replace(/mid-air projectile/, 'mid-air-projectile') : null;

    // Canonical notation from movelist images takes precedence over the
    // displayName-derived form. Frame name often has prefixes the movelist
    // doesn't: "L Hadoken" → "Hadoken", "SA1 Dragonlash Flame" → "...".
    const norm = normalizeName(row.displayName);
    const candidates = [
      norm,
      norm.replace(/^[lmh]\s+/, ''),
      norm.replace(/^(?:sa[123]|ca|od)\s+/, ''),
      norm.split(':')[0].trim(),
    ];
    let fromMovelist = null;
    let context = null;
    for (const c of candidates) {
      if (notationByName.has(c)) {
        fromMovelist = notationByName.get(c);
        context = contextByName.get(c) ?? null;
        break;
      }
    }
    // Capcom's "level" column may contain a strength letter (L/M/H), a
    // parenthesized condition (e.g. "(During a forward jump)"), or BOTH
    // ("(During Jinrai Kick)  L"). Extract each piece independently.
    let strength = null;
    let levelContext = null;
    if (row.level) {
      const m = row.level.match(/^(.*?)?\s*([LMH])$/);
      if (m && m[2]) strength = m[2];
      const condMatch = row.level.match(/\([^)]+\)/);
      if (condMatch) levelContext = condMatch[0];
      // Pure single-letter level (L/M/H alone)
      if (!condMatch && /^[LMH]$/.test(row.level)) strength = row.level;
    }

    // Append strength suffix to generic-button notation (e.g. "236P" + L → "236LP").
    if (fromMovelist && strength && /[PK]$/.test(fromMovelist) && !/[LMH][PK]$/.test(fromMovelist) && !fromMovelist.includes('+')) {
      fromMovelist = fromMovelist.replace(/([PK])$/, `${strength}$1`);
    }

    // Pick context: movelist skill_text wins over frame-table level conditional;
    // they're often the same content anyway. Avoid concatenating duplicates.
    if (!context && levelContext) context = levelContext;

    const notation = fromMovelist || derived?.notation || null;
    // input = display form: arrows + context. notation stays as numpad.
    const input = notationToInputDisplay(notation, context);

    out.moves[moveId] = {
      displayName: row.displayName,
      level: row.level,
      category,
      ...(context && { context }),
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

      // Bootstrap: when annotations don't exist yet, generate a skeletal
      // file so the character renders. Only writes if missing — never
      // clobbers existing annotation work.
      if (bootstrap && !dryRun) {
        const annotPath = resolve(ROOT, `src/data/annotations/${id}.json`);
        if (!existsSync(annotPath)) {
          const skel = {
            character: {
              id,
              name: data.character?.bio ? data.character.title || id : id,
              displayName: id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, ' '),
              archetype: 'tbd',
              description: '',
            },
            tactics: {},
            moves: Object.fromEntries(
              Object.entries(data.moves).map(([mid, m]) => [mid, {
                id: mid,
                yourPerspective: { tacticalUse: '', whenToUse: '', situations: [], range: '', connectsTo: [], executionDifficulty: '' },
                opponentPerspective: { riskLevel: '', riskDescription: '' },
                tacticalTags: [],
              }]),
            ),
          };
          mkdirSync(dirname(annotPath), { recursive: true });
          writeFileSync(annotPath, JSON.stringify(skel, null, 2) + '\n');
          console.log(`  bootstrapped annotations → ${annotPath}`);
          // Also ensure overrides skeleton
          const overPath = resolve(ROOT, `src/data/overrides/${id}.json`);
          if (!existsSync(overPath)) {
            writeFileSync(overPath, JSON.stringify({ id, moves: {} }, null, 2) + '\n');
          }
        }
      }
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\nDone.');
})();
