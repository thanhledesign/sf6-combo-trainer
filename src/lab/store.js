// Session Lab store. Everything is kept in the browser (localStorage) under the same
// keys as the standalone tracker, so existing data keeps working.
// Platform note: localStorage is isolated to this one file for a later Capacitor swap.
import { useSyncExternalStore } from 'react';
import { DEFAULT_TAGS, CLASSIC_TAGS, ROSTER, charIdToName } from './data';

const LS = 'srst.v1';
const UIK = 'srst.ui';

const read = (k) => { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

/* ---------- V01.32 classic tracker import (one way, nothing deleted) ---------- */
function importClassic(l) {
  const m = read('sf6-tracker:matches'), se = read('sf6-tracker:sessions'), ct = read('sf6-tracker:custom-loss-tags');
  if (!Array.isArray(m) || !m.length) return l;
  const seen = l.settings.classicSeen || [];
  const add = m.filter((x) => x && x.id && !seen.includes(x.id));
  if (!add.length) return l;
  const sids = new Set(l.sessions.map((x) => x.id));
  (se || []).forEach((x) => {
    if (!x || !x.id || sids.has(x.id)) return;
    const old = !x.endedAt && Date.now() - x.startedAt > 432e5;
    l.sessions.push({ id: x.id, start: x.startedAt, end: x.endedAt || (old ? x.startedAt : undefined), closed: !!x.endedAt || old, rule: (x.intent && x.intent.goal) || '', cues: [], check: { calm: 3, focus: 3, hands: 3 }, dev: 'Pad', me: 'Ken', stop: 3 });
  });
  const tags = Array.isArray(l.settings.tags) && l.settings.tags.length ? l.settings.tags.slice() : DEFAULT_TAGS.map((t) => ({ k: t[0], n: t[1], t: t[2] }));
  const have = new Set(tags.map((t) => t.k));
  [...CLASSIC_TAGS, ...(ct || []).map((t) => [t.id, t.label])].forEach((t) => { if (!have.has(t[0])) { have.add(t[0]); tags.push({ k: t[0], n: t[1], t: 'leak' }); } });
  l.settings.tags = tags;
  add.forEach((x) => {
    l.games.push({ id: 'c' + x.id, t: x.timestamp, sid: x.sessionId, r: x.result, char: charIdToName(x.opponentCharacter), oppMR: null, myMR: null, opp: '', rm: false, tags: x.lossTags || [], note: x.notes || '', dev: 'Pad', me: charIdToName(x.yourCharacter) || 'Ken', mode: 'ranked' });
    seen.push(x.id);
  });
  l.settings.classicSeen = seen;
  return l;
}

function load() {
  const raw = read(LS) || {};
  const l = {
    games: raw.games || [], sessions: raw.sessions || [], goals: raw.goals || [], streaks: raw.streaks || [],
    combos: raw.combos || [], reviews: raw.reviews || [], settings: raw.settings || {},
  };
  const before = (l.settings.classicSeen || []).length;
  importClassic(l);
  if ((l.settings.classicSeen || []).length !== before) write(LS, l);
  return l;
}

let state = typeof window === 'undefined' ? { games: [], sessions: [], goals: [], streaks: [], combos: [], reviews: [], settings: {} } : load();
const listeners = new Set();
const emit = (next) => { state = next; write(LS, state); listeners.forEach((f) => f()); };

export const subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };
export const getState = () => state;
export const useLab = () => useSyncExternalStore(subscribe, getState);

export function put(coll, id, data) {
  if (coll === 'settings') { emit({ ...state, settings: data }); return; }
  const arr = state[coll].slice(), row = { ...data, id };
  const i = arr.findIndex((x) => x.id === id);
  if (i >= 0) arr[i] = row; else arr.push(row);
  emit({ ...state, [coll]: arr });
}
export function del(coll, id) { emit({ ...state, [coll]: state[coll].filter((x) => x.id !== id) }); }
export function saveSettings(patch) { put('settings', 'main', { ...state.settings, ...patch }); }

/* ---------- per-device UI prefs (pane layout, drag pace, zoom) ---------- */
const UI0 = { sel: null, scale: 100, pace: 8, space: 36, rat: {}, hts: {} };
let ui = { ...UI0, ...(typeof window === 'undefined' ? {} : read(UIK) || {}) };
ui.rat = ui.rat || {}; ui.hts = ui.hts || {};
const uiL = new Set();
export const getUI = () => ui;
export const subscribeUI = (f) => { uiL.add(f); return () => uiL.delete(f); };
export const useUI = () => useSyncExternalStore(subscribeUI, getUI);
export function setUI(patch) { ui = { ...ui, ...patch }; write(UIK, ui); uiL.forEach((f) => f()); }

export { ROSTER };
