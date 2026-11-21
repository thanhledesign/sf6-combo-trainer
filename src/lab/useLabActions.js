// Game / session / goal actions. All write through the store; none touch the DOM.
import { put, saveSettings, getState } from './store';
import {
  cur, sgm, modeNow, meNow, devNow, opts, stopOf, strip, lossRun, evalGoal, estMR, postMR, byId, optPatch,
} from './calc';

export function startSession({ rule, cues, check }) {
  const S = getState(), id = 's' + Date.now(), stop = stopOf({ stop: S.settings.stop });
  saveSettings({ rule, cues });
  put('sessions', id, { start: Date.now(), check, rule, cues, dev: devNow(getState()), me: meNow(getState()), stop, closed: false });
}
export function endSession() {
  const s = cur(getState()); if (!s) return;
  put('sessions', s.id, { ...strip(s), closed: true, end: Date.now() });
}
export function setDevice(d) {
  saveSettings({ device: d });
  const s = cur(getState()); if (s) put('sessions', s.id, { ...strip(s), dev: d });
}
export const setMe = (c) => saveSettings({ me: c });
export const setMode = (m) => saveSettings({ mode: m });
export function endSet() {
  const s = cur(getState()); if (s) put('sessions', s.id, { ...strip(s), openSet: null });
}
export function updateStop(n) {
  const s = cur(getState()); if (s) put('sessions', s.id, { ...strip(s), stop: n });
  saveSettings({ stop: n });
}
export const setOpt = (path, val) => saveSettings(optPatch(getState(), path, val));

/** form = {char, oppMR, myMR, opp, tags:[], note}. Returns {toast?} */
export function logGame(res, form) {
  const S = getState(), s = cur(S);
  if (!s) return { toast: 'Start a session first' };
  const mode = modeNow(S), ranked = mode === 'ranked', o = opts(S), os = s.openSet && s.openSet.mode === mode ? s.openSet : null, t = Date.now();
  let ch, nm, om, rm;
  const oi = (form.opp || '').trim();
  if (os) { ch = os.char; nm = oi || os.opp || ''; om = ranked ? (form.oppMR != null ? form.oppMR : os.oppMR) : null; rm = os.n > 0; }
  else { ch = form.char; nm = oi; om = ranked ? form.oppMR : null; rm = false; }
  const my = ranked ? form.myMR : null;
  const g = { t, sid: s.id, r: res, char: ch || null, oppMR: om == null ? null : om, myMR: my == null ? null : my, opp: nm, rm, tags: form.tags || [], note: (form.note || '').trim(), dev: devNow(S), me: meNow(S), mode };
  let ns = null, msg;
  if (ch) {
    const n = (os ? os.n : 0) + 1, w = (os ? os.w : 0) + (res === 'W' ? 1 : 0), l = (os ? os.l : 0) + (res === 'L' ? 1 : 0), L = ranked ? o.setLen : 0, half = Math.floor(L / 2);
    const ended = L > 0 && (n >= L || (o.setEarly && (w > half || l > half)));
    g.set = os ? os.id : 'x' + t;
    if (ended) msg = `Set over ${w}–${l} vs ${ch}. Pick the next opponent.`;
    else ns = { id: g.set, mode, char: ch, opp: nm, oppMR: om == null ? null : om, n, w, l };
  }
  put('games', 'g' + t, g);
  put('sessions', s.id, { ...strip(s), openSet: ns });
  return { toast: msg, keep: !!ns };
}

/* ----- stop-rule lock ----- */
export function lockState(S) {
  const s = cur(S), o = opts(S); if (!s || !o.lock) return null;
  const a = sgm(S, s, 'ranked'), N = stopOf(s);
  if (N > 0 && a.length && lossRun(a) >= N && s.ack !== a[a.length - 1].id) return { N, last: a[a.length - 1], s };
  return null;
}
export function lockSave(note) {
  const S = getState(), L = lockState(S); if (!L) return;
  put('games', L.last.id, { ...strip(L.last), note: (L.last.note ? L.last.note + ' | ' : '') + note });
  put('sessions', L.s.id, { ...strip(getState().sessions.find((x) => x.id === L.s.id)), ack: L.last.id });
}
export function lockEnd() {
  const S = getState(), L = lockState(S); if (!L) return;
  put('sessions', L.s.id, { ...strip(L.s), closed: true, end: Date.now(), ack: L.last.id });
}

/* ----- last-game MR from the result screen (debounced by the caller) ----- */
export function saveResult(g, my) {
  const c = byId(getState().games, g.id) || g;
  put('games', g.id, { ...strip(c), myAfter: my, oppAfter: c.oppMR != null ? c.oppMR - (my - c.myMR) : null });
}

/* ----- goals ----- */
export function syncGoals() {
  const S = getState();
  S.goals.forEach((g) => {
    const e = evalGoal(S, g);
    if (e.done && !g.doneAt && !syncGoals.pend[g.id]) { syncGoals.pend[g.id] = 1; put('goals', g.id, { ...strip(g), doneAt: e.at || Date.now() }); }
  });
}
syncGoals.pend = {};
export function addSuggestion(s) {
  const S = getState();
  put('goals', 'o' + Date.now(), { kind: s.kind, target: s.target, title: '', minOpp: s.minOpp, oppChar: null, me: null, created: s.existing ? 0 : Date.now(), base: s.kind === 'mr' ? estMR(S, meNow(S)) : null, manual: 0, doneAt: null });
}
export { postMR };

export function toggleFocus(id) {
  const c = getState().combos.find((x) => x.id === id);
  if (c) put('combos', id, { ...strip(c), focus: !c.focus, focusAt: Date.now() });
}
