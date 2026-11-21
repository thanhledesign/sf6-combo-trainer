// Combo damage / frame-data engine. Pure: (tokens, character moves) → numbers.
// Rules (SF6, from community-verified scaling data; all editable per combo in the UI):
//   attack #      1    2    3   4   5   6   7   8   9   10+
//   normal        100  100  80  70  60  50  40  30  20  10 %
//   20% starter   100  80   70  60  50  40  30  20  10  10 %   (light normals, 2MK, Drive Impact)
//   Drive Rush mid-combo: ×0.85 on every later hit.  Super minimum: SA1 30 / SA2 40 / SA3+CA 50 %.
//   Counter hit: +20% on the first hit, +2 hit advantage.  Punish counter: +20%, +4 hit advantage.
import { isDirs, isBtn } from './combo';

export const GENERAL = [100, 100, 80, 70, 60, 50, 40, 30, 20, 10];
export const CH_BONUS = 1.2, PC_BONUS = 1.2, CH_ADV = 2, PC_ADV = 4, DR_SCALE = 0.85;
export const SUPER_MIN = { SA1: 30, SA2: 40, SA3: 50, CA: 50 };

const LIGHTS = /^(5|2)?L[PK]$/;
export const isJump = (m) => /(^|_)n?j_|aerial/i.test(m.id || '') || /^[789]/.test(m.notation || '');
const norm = (x) => String(x || '').replace(/\s+/g, '').toUpperCase();
const num = (v) => (typeof v === 'number' ? v : null);

// scaling % for the k-th damaging attack (0-based) with a starter penalty x (0, 20, 30 …)
export function scaleAt(k, x) {
  if (!x) return GENERAL[Math.min(k, GENERAL.length - 1)];
  if (k === 0) return 100;
  return Math.max(100 - x - 10 * (k - 1), 10);
}

// Starter penalty by move: lights and 2MK = 20, Drive Impact = 20, else none (editable per combo).
export function starterPenalty(mv) {
  if (!mv) return 0;
  const n = norm(mv.notation);
  if (LIGHTS.test(n) || n === '2MK' || /drive_impact/i.test(mv.id || '')) return 20;
  return 0;
}

const findSuper = (moves, tok) => {
  const key = tok.toLowerCase();
  const byId = moves.find((m) => new RegExp(`_${key}(_|$)`).test(m.id || '') && m.category === 'super');
  if (byId) return byId;
  const supers = moves.filter((m) => m.category === 'super');
  return supers[{ SA1: 0, SA2: 1, SA3: 2, CA: 3 }[tok]] || null;
};

// Turn the token list into attack pieces. `move` is null when the notation isn't in the frame data.
export function parseCombo(toks, moves) {
  const out = [], byNot = (n) => moves.find((m) => !isJump(m) && (norm(m.notation) === norm(n) || norm(m.shortName) === norm(n)));
  let i = 0;
  while (i < (toks || []).length) {
    const t = toks[i], t1 = toks[i + 1];
    if (t === 'DRC' || t === 'DR') { out.push({ type: 'dr', label: t }); i++; continue; }
    if (['xx', '>', ',', '+', '-', 'OD'].includes(t)) { i++; continue; }
    if (SUPER_MIN[t]) { out.push({ type: 'hit', label: t, tok: t, move: findSuper(moves, t), sa: t }); i++; continue; }
    if (t === 'THROW') { out.push({ type: 'hit', label: t, move: moves.find((m) => m.category === 'throw') || null }); i++; continue; }
    if (t === 'DI') { out.push({ type: 'hit', label: t, move: moves.find((m) => /drive_impact/i.test(m.id || '')) || null }); i++; continue; }
    if (t === 'j.') { const jm = t1 && isBtn(t1) ? moves.find((m) => isJump(m) && norm(m.shortName || m.notation).endsWith(norm(t1))) : null; out.push({ type: 'hit', label: 'j.' + (t1 || ''), move: jm || null }); i += t1 && isBtn(t1) ? 2 : 1; continue; }
    if (isDirs(t) && t1 && isBtn(t1)) { out.push({ type: 'hit', label: t + t1, move: byNot(t + t1) || null }); i += 2; continue; }
    if (isBtn(t)) { out.push({ type: 'hit', label: t, move: byNot('5' + t) || byNot(t) || byNot('236' + t) || null }); i++; continue; }
    if (isDirs(t)) { i++; continue; } // a bare direction with nothing after it
    out.push({ type: 'hit', label: t, move: byNot(t) || null }); i++;
  }
  return out;
}

// mode: 'hit' | 'ch' | 'pc'. man = per-combo manual values (see ComboStats).
export function calcCombo(toks, moves, man = {}) {
  const pieces = parseCombo(toks, moves);
  const hits = pieces.filter((p) => p.type === 'hit');
  const starter = hits[0] && hits[0].move;
  const x = man.starter != null && man.starter !== '' ? Number(man.starter) : starterPenalty(starter);
  const run = (bonus) => {
    let k = 0, dr = 1, total = 0; const steps = [];
    for (const p of pieces) {
      if (p.type === 'dr') { dr = DR_SCALE; continue; }
      const base = p.move && num(p.move.damage);
      let sc = scaleAt(k, x) * dr;
      if (p.sa) sc = Math.max(sc, SUPER_MIN[p.sa]);
      const bonusHere = k === 0 ? bonus : 1;
      const dmg = base == null ? 0 : Math.round((base * sc / 100) * bonusHere);
      steps.push({ label: p.label, move: p.move, base, scale: Math.round(sc * 10) / 10, dmg, unmatched: !p.move || base == null });
      total += dmg; k++;
    }
    return { total, steps };
  };
  const hit = run(1), ch = run(CH_BONUS), pc = run(PC_BONUS);
  const adv = (m) => (m && m.opponentPerspective && m.opponentPerspective.frameAdvantage) || (m && m.frameAdvantage) || {};
  const sa = adv(starter), ender = hits.length ? hits[hits.length - 1].move : null, ea = adv(ender);
  const info = {
    starter, ender, startup: starter && num(starter.frameData && starter.frameData.startup),
    onBlock: num(sa.onBlock), onHit: num(sa.onHit), enderHit: num(ea.onHit), enderBlock: num(ea.onBlock),
  };
  return {
    pieces, hits: hits.length, starterPenalty: x, unmatched: hit.steps.filter((s) => s.unmatched).length,
    auto: { hit: hit.total, ch: ch.total, pc: pc.total }, steps: { hit: hit.steps, ch: ch.steps, pc: pc.steps }, info,
  };
}

const pick = (manual, auto) => (manual !== '' && manual != null && !Number.isNaN(Number(manual)) ? Number(manual) : auto);
// Final numbers: manual values win over auto, field by field.
export function finalStats(calc, man = {}) {
  const i = calc.info;
  return {
    hit: pick(man.dmg, calc.auto.hit), ch: pick(man.ch, calc.auto.ch), pc: pick(man.pc, calc.auto.pc),
    startup: pick(man.startup, i.startup), onHit: pick(man.onHit, i.onHit), onBlock: pick(man.onBlock, i.onBlock),
    manual: { hit: man.dmg != null && man.dmg !== '', ch: man.ch != null && man.ch !== '', pc: man.pc != null && man.pc !== '', startup: man.startup != null && man.startup !== '', onHit: man.onHit != null && man.onHit !== '', onBlock: man.onBlock != null && man.onBlock !== '' },
  };
}
