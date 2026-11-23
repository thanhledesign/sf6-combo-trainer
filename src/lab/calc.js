// Pure helpers: given the Lab state `S`, derive records, MR estimates, goals, etc.
// Ported from the standalone tracker; no DOM or React in here.
import { DEFAULT_TAGS, MODES } from './data';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const num = (v) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; };
export const strip = (o) => { const c = { ...o }; delete c.id; return c; };
export const byId = (a, id) => a.find((x) => x.id === id) || null;

const SHOW0 = { oppMR: true, myMR: true, oppName: true, rematch: true, tags: true, note: false, rage: true };
const DASH0 = { record: true, win: true, streak: true, mr: true, lights: true, games: true, minutes: true, rule: true, dots: true, rematch: true, goal: true };

export function opts(S) {
  const o = S.settings.opts || {};
  return {
    setLen: typeof o.setLen === 'number' ? o.setLen : 3,
    setEarly: o.setEarly !== false,
    lock: o.lock !== false,
    lockMin: typeof o.lockMin === 'number' ? o.lockMin : 8,
    rageWarn: o.rageWarn !== false,
    autoRematch: o.autoRematch !== false,
    quickRematch: o.quickRematch !== false,
    k: typeof o.k === 'number' ? o.k : 16,
    dotsN: typeof o.dotsN === 'number' ? o.dotsN : 12,
    show: { ...SHOW0, ...(o.show || {}) },
    dash: { ...DASH0, ...(o.dash || {}) },
  };
}
export const optGet = (S, path) => { const o = opts(S), p = path.split('.'); return p.length === 2 ? o[p[0]][p[1]] : o[p[0]]; };
export function optPatch(S, path, val) {
  const o = JSON.parse(JSON.stringify(S.settings.opts || {})), p = path.split('.');
  if (p.length === 2) { o[p[0]] = o[p[0]] || {}; o[p[0]][p[1]] = val; } else o[p[0]] = val;
  return { opts: o };
}

export const modeNow = (S) => S.settings.mode || 'ranked';
export const modeOf = (g) => g.mode || 'ranked';
export const modeName = (m) => (MODES.find((x) => x[0] === m) || [m, m])[1];
export const meNow = (S) => S.settings.me || 'Ken';
export const devNow = (S) => S.settings.device || 'Stick';
export const stopOf = (s) => (s && typeof s.stop === 'number' ? s.stop : 3);

export const tagList = (S) => {
  const t = S.settings.tags;
  return Array.isArray(t) && t.length ? t.map((x) => [x.k, x.n, x.t]) : DEFAULT_TAGS;
};
export const tagObjs = (S) => tagList(S).map((t) => ({ k: t[0], n: t[1], t: t[2] }));
export const tagInfo = (S, k) => tagList(S).find((t) => t[0] === k) || [k, k, 'good'];

export const cur = (S) => {
  const o = S.sessions.filter((s) => !s.closed).sort((a, b) => a.start - b.start);
  return o.length ? o[o.length - 1] : null;
};
export const lastClosed = (S) => S.sessions.filter((x) => x.closed).sort((a, b) => (b.end || b.start) - (a.end || a.start))[0] || null;
export const allGames = (S) => S.games.slice().sort((a, b) => a.t - b.t);
export const sg = (S, s) => allGames(S).filter((g) => g.sid === s.id);
export const sgm = (S, s, m) => sg(S, s).filter((g) => modeOf(g) === (m || modeNow(S)));
export const lastGame = (S) => { const s = cur(S); if (!s) return null; const a = sg(S, s); return a.length ? a[a.length - 1] : null; };
export const openSetNow = (S) => { const s = cur(S); return s && s.openSet && s.openSet.mode === modeNow(S) ? s.openSet : null; };

export const wl = (a) => { const w = a.filter((g) => g.r === 'W').length; return { w, l: a.length - w, n: a.length }; };
export const pct = (w, n) => (n ? Math.round((w / n) * 100) + '%' : '–');
export const recStr = (a) => { const r = wl(a); return `${r.w}–${r.l}`; };
export const lossRun = (a) => { let n = 0; for (let i = a.length - 1; i >= 0 && a[i].r === 'L'; i--) n++; return n; };
export const winRun = (a) => { let n = 0; for (let i = a.length - 1; i >= 0 && a[i].r === 'W'; i--) n++; return n; };
export const streakStr = (a) => {
  if (!a.length) return '–';
  const r = a[a.length - 1].r; let n = 0;
  for (let i = a.length - 1; i >= 0 && a[i].r === r; i--) n++;
  return r + n;
};
export const gap = (g) => (g.oppMR != null && g.myMR != null ? g.oppMR - g.myMR : null);
export const sgn = (n) => (n > 0 ? '+' : '') + n;

// Elo-style estimate of my MR after a game (K from options), unless the result-screen number was entered.
export function postMR(S, g) {
  if (g.myAfter != null) return g.myAfter;
  const w = g.r === 'W' ? 1 : 0;
  return g.myMR + (g.oppMR != null ? Math.round(opts(S).k * (w - 1 / (1 + Math.pow(10, (g.oppMR - g.myMR) / 400)))) : (w ? 8 : -8));
}
// MR change for each fighter in one game (me from the result screen or the Elo estimate; opponent mirrors it unless entered).
export function deltas(S, g) {
  if (g.myMR == null) return null;
  const me = postMR(S, g) - g.myMR;
  const opp = g.oppMR == null ? null : (g.oppAfter != null ? g.oppAfter - g.oppMR : -me);
  return { me, opp };
}
export function estMR(S, me) {
  const a = allGames(S);
  for (let i = a.length - 1; i >= 0; i--) { const g = a[i]; if ((g.me || 'Ken') !== me) continue; if (g.myMR != null) return postMR(S, g); }
  return null;
}

export function runs(S) {
  const out = []; let c = null;
  allGames(S).forEach((g) => {
    if (g.r === 'W') {
      if (c && c.sid === g.sid) { c.len++; c.end = g.t; c.games.push(g); }
      else { c = { sid: g.sid, len: 1, start: g.t, end: g.t, games: [g] }; out.push(c); }
    } else c = null;
  });
  return out;
}
export function bestEver(S) {
  let b = 0;
  runs(S).forEach((r) => { if (r.len > b) b = r.len; });
  S.streaks.forEach((x) => { if (x.len > b) b = x.len; });
  return b;
}

/* ---------- goals ---------- */
export function goalTitle(g) {
  if (g.title) return g.title;
  const T = g.target || 1;
  if (g.kind === 'mr') return `Reach ${T} MR`;
  if (g.kind === 'streak') return `Win ${T} in a row`;
  if (g.kind === 'beat') return `Beat ${T > 1 ? T + ' opponents' : 'an opponent'} at ${g.minOpp || 0}+ MR`;
  if (g.kind === 'wins') return `Win ${T} games`;
  if (g.kind === 'games') return `Play ${T} games`;
  return 'Custom goal';
}
const gGames = (S, g) => allGames(S).filter((x) => x.t >= (g.created || 0) && (!g.me || (x.me || 'Ken') === g.me));
export function evalGoal(S, g) {
  const a = gGames(S, g), T = Math.max(1, g.target || 1);
  let cur = 0, at = null;
  if (g.kind === 'mr') {
    let best = null;
    a.forEach((x) => { if (x.myMR == null) return; const p = postMR(S, x); if (best == null || p > best) best = p; if (p >= T && at == null) at = x.t + 1; });
    cur = best != null ? best : (g.base || 0);
    const base = g.base != null ? g.base : null;
    const pc = base != null && T > base ? (cur - base) / (T - base) : cur / T;
    return { cur, T, pct: clamp(pc, 0, 1), done: cur >= T || !!g.doneAt, at: g.doneAt || at };
  }
  if (g.kind === 'streak') {
    const rs = {};
    a.forEach((x) => {
      if (x.r === 'W') { rs[x.sid] = (rs[x.sid] || 0) + 1; if (rs[x.sid] > cur) cur = rs[x.sid]; if (rs[x.sid] >= T && at == null) at = x.t; }
      else rs[x.sid] = 0;
    });
  } else if (g.kind === 'beat' || g.kind === 'wins') {
    const m = a.filter((x) => x.r === 'W' && (g.kind === 'wins' || (x.oppMR != null && x.oppMR >= (g.minOpp || 0))) && (!g.oppChar || x.char === g.oppChar));
    cur = m.length; if (cur >= T) at = m[T - 1].t;
  } else if (g.kind === 'games') { cur = a.length; if (cur >= T) at = a[T - 1].t; }
  else cur = g.manual || 0;
  return { cur, T, pct: clamp(cur / T, 0, 1), done: cur >= T || !!g.doneAt, at: g.doneAt || at || (cur >= T ? Date.now() : null) };
}
export function suggestions(S, me) {
  const e = estMR(S, me) || 1500, have = S.goals.map((g) => `${g.kind}:${g.target}:${g.minOpp || ''}`), out = [];
  const add = (t, k, T, min, ex) => { const key = `${k}:${T}:${min || ''}`; if (!have.includes(key)) out.push({ title: t, kind: k, target: T, minOpp: min || null, existing: !!ex }); };
  add(`Reach ${Math.ceil((e + 1) / 25) * 25} MR`, 'mr', Math.ceil((e + 1) / 25) * 25);
  [1600, 1700, 1800].forEach((b) => { if (e < b) add(`Reach ${b} MR (${b === 1600 ? 'High Master' : b === 1700 ? 'Grand Master' : 'Ultimate Master'})`, 'mr', b); });
  add('Beat an Ultimate Master (1800+)', 'beat', 1, 1800, true); add('Beat a Grand Master (1700+)', 'beat', 1, 1700, true);
  add('Beat 3 opponents at 1600+', 'beat', 3, 1600); add('Win 5 in a row', 'streak', 5); add('Win 8 in a row', 'streak', 8); add('Win 10 in a row', 'streak', 10);
  return out.slice(0, 7);
}
export function milestones(S, meFilter) {
  const a = allGames(S).filter((g) => !meFilter || meFilter === 'all' || (g.me || 'Ken') === meFilter), m = [];
  [[1600, 'High Master'], [1700, 'Grand Master'], [1800, 'Ultimate Master']].forEach((b) => {
    const g = a.find((x) => x.r === 'W' && x.oppMR != null && x.oppMR >= b[0]);
    if (g) m.push({ t: g.t, l: `First win vs a ${b[1]} (${b[0]}+)`, d: `${g.char ? g.char + ' ' : ''}${g.opp ? g.opp + ' ' : ''}${g.oppMR} MR` });
  });
  let up = null; a.forEach((g) => { if (g.r === 'W' && gap(g) != null && (up == null || gap(g) > gap(up))) up = g; });
  if (up && gap(up) > 0) m.push({ t: up.t, l: 'Biggest upset win', d: `+${gap(up)} MR gap vs ${up.char || '?'} ${up.oppMR}` });
  let hi = null; a.forEach((g) => { if (g.myMR != null) { const p = postMR(S, g); if (hi == null || p > hi.p) hi = { p, t: g.t }; } });
  if (hi) m.push({ t: hi.t, l: 'Highest MR reached', d: `${hi.p} MR` });
  let br = null; runs(S).filter((r) => a.some((g) => g.sid === r.sid)).forEach((r) => { if (!br || r.len > br.len) br = r; });
  if (br && br.len >= 3) m.push({ t: br.start, l: 'Longest logged win streak', d: `${br.len} wins` });
  return m.sort((x, y) => y.t - x.t);
}

/* ---------- formatting ---------- */
const p2 = (n) => (n < 10 ? '0' + n : '' + n);
export const fmtT = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${p2(d.getMinutes())}`; };
export const fmtD = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; };

export function toCsv(S) {
  const rows = [['time','session','me','device','result','opp_char','opponent','opp_mr','my_mr','my_mr_after','opp_mr_after','gap','rematch','tags','note']];
  allGames(S).forEach((g) => rows.push([new Date(g.t).toISOString(), g.sid, g.me || 'Ken', g.dev || '', g.r, g.char || '', g.opp || '', g.oppMR ?? '', g.myMR ?? '', g.myAfter ?? '', g.oppAfter ?? '', gap(g) ?? '', g.rm ? 1 : 0, (g.tags || []).join(' '), g.note || '']));
  return rows.map((r) => r.map((c) => { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',')).join('\n');
}

/* ---------- per-character profile (from your own logged games) ---------- */
export function charStats(S, me) {
  const a = allGames(S).filter((g) => (g.me || 'Ken') === me);
  const r = wl(a), ranked = a.filter((g) => g.myMR != null);
  let peak = null; ranked.forEach((g) => { const p = postMR(S, g); if (peak == null || p > peak.v) peak = { v: p, t: g.t }; });
  let best = 0, run = 0, sid = null;
  a.forEach((g) => { if (g.r === 'W') { run = g.sid === sid ? run + 1 : 1; sid = g.sid; if (run > best) best = run; } else { run = 0; sid = null; } });
  let bestWin = null; a.forEach((g) => { if (g.r === 'W' && g.oppMR != null && (!bestWin || g.oppMR > bestWin.oppMR)) bestWin = g; });
  const by = {}; a.forEach((g) => { if (g.char && g.char !== 'Random') (by[g.char] = by[g.char] || []).push(g); });
  const rows = Object.keys(by).map((c) => ({ c, ...wl(by[c]) }));
  const worst = rows.filter((x) => x.n >= 3).sort((x, y) => x.w / x.n - y.w / y.n || y.n - x.n)[0] || null;
  const top = rows.filter((x) => x.n >= 3).sort((x, y) => y.w / y.n - x.w / x.n || y.n - x.n)[0] || null;
  const most = rows.slice().sort((x, y) => y.n - x.n)[0] || null;
  const sessions = new Set(a.map((g) => g.sid)).size;
  return { n: r.n, w: r.w, l: r.l, peak, now: estMR(S, me), best, bestWin, worst, top, most, sessions, last: a.length ? a[a.length - 1].t : null };
}

/* ----- rage meter (V01.44): 1 calm .. 10 nuclear, set by the player during a session ----- */
export const RAGE_NAMES = ['', 'Peace', 'Zen', 'Chill', 'Fine', 'Annoyed', 'Heated', 'Tilting', 'Furious', 'Seething', 'Nuclear'];
export const rageName = (r) => RAGE_NAMES[clamp(Math.round(r) || 1, 1, 10)];
/** Warning for the live session: rage on its own, or rage stacked with a loss run. null = all clear. */
export function rageWarn(rage, run) {
  if (rage == null) return null;
  const hot = rage >= 9 ? 3 : rage >= 8 || (rage >= 6 && run >= 2) || (rage >= 5 && run >= 3) ? 2 : rage >= 6 || (rage >= 4 && run >= 2) ? 1 : 0;
  if (!hot) return null;
  const why = `Rage ${rage} (${rageName(rage)})${run >= 2 ? ` after ${run} losses in a row` : ''}`;
  return hot === 3 ? { level: 3, text: `${why}. Stop. Close the game and walk away for 20+ minutes.` }
    : hot === 2 ? { level: 2, text: `${why}. Take a break before the next queue.` }
    : { level: 1, text: `${why}. Heating up. Slow down, one cue word, no pressing on minus.` };
}
