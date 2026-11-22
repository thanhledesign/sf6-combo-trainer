// Fills in a command for moves Capcom lists without one (dashes, Drive Reversal, Perfect Parry, and
// strength/level variants of a move that has a command), so the card can still show button art.
// Pure + deterministic; never overwrites a real Capcom input. Numbered follow-ups ("(2)") and
// "[Quick Dash] ..." variants are intentionally left alone (their command depends on context we don't have).
import { parseInput } from './buttonInput.js';

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const STRENGTH = /^(L|M|H|OD)\s+/;
const qualifiers = (n) => (n || '').replace(/\((?:lv\s*\d|charged|projectile|burst|strike)[^)]*\)/gi, '').replace(/\(\s*\)/g, '');
const coreKey = (n) => norm(qualifiers(n).replace(STRENGTH, ''));
const strengthOf = (n) => { const m = (n || '').match(STRENGTH); return m ? m[1] : null; };
// Re-key a command's button strength: 'M' -> 'MP', 'OD' -> generic 'P'.
function withStrength(input, s) {
  if (s === 'OD') return input.replace(/\b[LMH]([PK])\b/g, '$1');
  if (s === 'L' || s === 'M' || s === 'H') {
    return input.replace(/\b[LMH]([PK])\b/g, `${s}$1`).replace(/(^|[^A-Za-z])([PK])(?![A-Za-z])/g, `$1${s}$2`);
  }
  return input;
}

export function deriveInputs(moves) {
  const out = {};
  const usable = (m) => m && m.input && parseInput(m.input);
  const byCore = new Map();
  for (const [id, m] of Object.entries(moves)) {
    if (!usable(m)) continue;
    const k = coreKey(m.displayName);
    if (!byCore.has(k)) byCore.set(k, []);
    byCore.get(k).push({ id, s: strengthOf(m.displayName), m });
  }
  for (const [id, m] of Object.entries(moves)) {
    if (m.input || !m.displayName) continue;
    const name = m.displayName.trim();
    if (/^forward dash$/i.test(name)) { out[id] = '→→'; continue; }
    if (/^backward dash$/i.test(name)) { out[id] = '←←'; continue; }
    if (/^drive reversal/i.test(name)) { out[id] = '→ + HP + HK'; continue; }
    if (/^perfect parry/i.test(name)) { out[id] = 'MP + MK'; continue; }
    if (/\(\d\)\s*$/.test(name) || /^\[/.test(name) || /^\(/.test(name)) continue;
    const s = strengthOf(name);
    const sibs = (byCore.get(coreKey(name)) || []).filter((x) => x.id !== id);
    if (!sibs.length) continue;
    const exact = sibs.find((x) => x.s === s) || sibs[0];
    let input = exact.s === s ? exact.m.input : withStrength(exact.m.input, s);
    // charge / hold stages keep the same command but the button is held
    if (/hold|charged/i.test(`${m.level || ''} ${name}`) && !/^\(/.test(input)) input = `(Hold button) ${input}`;
    if (parseInput(input)) out[id] = input;
  }
  return out;
}
