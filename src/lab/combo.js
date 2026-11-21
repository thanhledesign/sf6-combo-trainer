// Combo notation engine. Pure functions over a small mutable `cb` object
// ({toks, hold, lt}) so the React editor can keep it in a ref.

export const HOLD_MS = 380;
export const TAP_MS = 1000; // window to tap P/K again and cycle L→M→H (each tap restarts it)
const LV = { 1: 'L', 2: 'M', 3: 'H', 4: '' };
export const SAS = ['SA1', 'SA2', 'SA3', 'CA'];

export const isDirs = (x) => /^(\[[1-9]\])?[1-9]+$/.test(x) || x === '360';
export const isBtn = (x) => /^([LMH]?[PK]|PP|KK|PPP|KKK)$/.test(x);

// keyboard key, token, label
export const MAC = [
  ['q', '236', 'QCF'], ['w', '214', 'QCB'], ['e', '623', 'DP'], ['y', '41236', 'HCF'], ['u', '63214', 'HCB'],
  ['a', '[4]6', 'charge ←→'], ['f', '[2]8', 'charge ↓↑'], ['g', '22', '↓↓'], ['h', '360', '360'],
];
export const TOKS = [
  ['d', 'DRC', 'DRC'], ['r', 'DR', 'DR'], ['o', 'OD', 'OD'], ['i', 'DI', 'Drive Imp'], ['t', 'THROW', 'Throw'],
  ['j', 'j.', 'jump'], ['x', 'xx', 'cancel'], [',', ',', 'link'], ['-', '-', 'dash'], ['+', '+', 'plus'], ['>', '>', 'then'], ['[', 'PPP', '3×P'], [']', 'KKK', '3×K'],
];
export const CKEYS = 'zvbnml';
// Per-character move tokens (first six map to z v b n m l). Ken is verified; the rest are common notation.
export const CM = {
  'Ken': [['KK', 'Quick Dash'], ['6LK', 'Jinrai ▸ low'], ['6MK', 'Jinrai ▸ axe'], ['6HK', 'Jinrai ▸ snap']],
  'Luke': [['[214P]', 'Charge FK'], ['[214P]*', 'Perfect FK'], ['PPP', 'Avenger ▸'], ['LP+LK', 'DDT']],
  'Terry': [['6HP', 'Hammer'], ['MP>HP', 'Power Drive']],
  'Ryu': [['22P', 'Denjin'], ['MP>HP', 'Collarbone']],
  'Chun-Li': [['214P', 'Serenity'], ['[4]6P', 'Kikoken'], ['[2]8K', 'Spin Bird']],
  'Guile': [['[4]6P', 'Sonic Blade'], ['[2]8K', 'Flash Kick']],
  'Zangief': [['360P', 'SPD'], ['PPP', 'Lariat'], ['KKK', 'Lariat']],
  'Dhalsim': [['623PPP', 'Teleport ▸'], ['421PPP', 'Teleport ◂']],
  'Akuma': [['623PPP', 'Ashura ▸'], ['421PPP', 'Ashura ◂'], ['PPP', 'Demon']],
  'Blanka': [['[4]6P', 'Roll'], ['[2]8K', 'V-Roll']],
  'M. Bison': [['[4]6P', 'Psycho Crush'], ['[4]6K', 'Scissor'], ['[2]8K', 'Head Press']],
  'Sagat': [['236P', 'Tiger Shot'], ['623P', 'Tiger Upper'], ['236K', 'Tiger Knee']],
  'Cammy': [['236K', 'Spiral Arrow'], ['623K', 'Cannon Spike'], ['LP+LK', 'Killer Bee']],
  'Dee Jay': [['[4]6P', 'Air Slasher'], ['[2]8K', 'Jackknife']],
  'E. Honda': [['[4]6P', 'Headbutt'], ['[2]8K', 'Sumo Smash']],
};

export const MACK = Object.fromEntries(MAC.map((m) => [m[0], m[1]]));
export const TOKK = { '.': '>', '=': '+', ...Object.fromEntries(TOKS.map((t) => [t[0], t[1]])) };
export const charKeyToken = (char, key) => { const i = CKEYS.indexOf(key); const m = (CM[char] || [])[i]; return m ? m[0] : null; };

export const newCb = () => ({ toks: [], hold: {}, lt: null });

export function comboStr(t) {
  let o = '', i = 0, prevTight = false;
  while (i < t.length) {
    const x = t[i]; let piece;
    if ((isDirs(x) || x === 'j.') && i + 1 < t.length && isBtn(t[i + 1])) { piece = x + t[i + 1]; i += 2; } else { piece = x; i++; }
    // , attaches to what came before; + and - are tight on both sides (LP+LK, 2MP-HP)
    const tight = piece === '+' || piece === '-';
    o += (piece === ',' || tight || !o || prevTight) ? piece : ' ' + piece;
    prevTight = tight;
  }
  return o;
}
export const push = (cb, tok) => { cb.toks.push(tok); cb.lt = null; };
export function dir(cb, d) {
  const L = cb.toks[cb.toks.length - 1];
  if (L && isDirs(L)) cb.toks[cb.toks.length - 1] = L + d; else cb.toks.push(d);
  cb.lt = null;
}
export const down = (cb, k, now = Date.now()) => { if (cb.hold[k] == null) cb.hold[k] = now; };
export function up(cb, k, now = Date.now()) {
  if (cb.hold[k] == null) return;
  const d = now - cb.hold[k]; delete cb.hold[k];
  if (d >= HOLD_MS) { push(cb, k); return; }
  const lt = cb.lt;
  if (lt && lt.k === k && now - lt.t < TAP_MS && cb.toks.length - 1 === lt.idx) {
    lt.lvl = (lt.lvl % 4) + 1; lt.t = now; cb.toks[lt.idx] = LV[lt.lvl] + k;
  } else { cb.toks.push('L' + k); cb.lt = { k, t: now, lvl: 1, idx: cb.toks.length - 1 }; }
}
export function sa(cb) {
  const L = cb.toks[cb.toks.length - 1], i = SAS.indexOf(L);
  if (i >= 0) cb.toks[cb.toks.length - 1] = SAS[(i + 1) % 4]; else cb.toks.push('SA1');
  cb.lt = null;
}
export const tok = (cb, k) => { if (k === 'SA') sa(cb); else push(cb, k); };
export function back(cb) {
  const L = cb.toks[cb.toks.length - 1]; if (L == null) return;
  if (isDirs(L) && L.length > 1) cb.toks[cb.toks.length - 1] = L.slice(0, -1); else cb.toks.pop();
  cb.lt = null;
}
