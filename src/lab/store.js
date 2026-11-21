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

/* ---------- change tracking for cloud sync (src/lab/sync.js) ---------- */
const DIRTY = 'srst.dirty', TOMB = 'srst.del';
let dirty = (typeof window === 'undefined' ? null : read(DIRTY)) || {};
let tomb = (typeof window === 'undefined' ? null : read(TOMB)) || {};
const changeL = new Set();
const mark = (coll, id) => { dirty[`${coll}/${id}`] = 1; write(DIRTY, dirty); changeL.forEach((f) => f()); };
export const onLocalChange = (f) => { changeL.add(f); return () => changeL.delete(f); };
export const getDirty = () => Object.keys(dirty);
export const clearDirty = (keys) => { keys.forEach((k) => { delete dirty[k]; }); write(DIRTY, dirty); };
export const getTomb = () => tomb;
const COLLS = ['games', 'sessions', 'goals', 'streaks', 'combos', 'reviews'];
const stampOf = (r) => r.t || r.start || r.created || Date.now();

/** Give pre-sync records a timestamp and queue them for upload (settings only if `withSettings`). */
export function stampLocal(withSettings) {
  let n = 0; const next = { ...state };
  COLLS.forEach((c) => {
    next[c] = state[c].map((r) => { if (r._u != null) return r; n++; mark(c, r.id); return { ...r, _u: stampOf(r) }; });
  });
  if (withSettings && Object.keys(state.settings).length && state.settings._u == null) { next.settings = { ...state.settings, _u: Date.now() }; mark('settings', 'main'); n++; }
  if (n) emit(next);
  return n;
}

/** Merge rows pulled from the cloud. Newer timestamp wins; never marks anything dirty. */
export function applyRemote(rows) {
  let next = { ...state }, changed = false;
  rows.forEach((row) => {
    const key = `${row.coll}/${row.id}`, u = Number(row.updated_at);
    if (tomb[key] != null && tomb[key] >= u) return; // we deleted it after that version
    if (row.coll === 'settings') {
      const cur = next.settings;
      if ((cur._u || 0) >= u) return;
      next = { ...next, settings: { ...row.data, _u: u } }; changed = true; return;
    }
    if (!COLLS.includes(row.coll)) return;
    const arr = next[row.coll], i = arr.findIndex((x) => x.id === row.id), local = i >= 0 ? arr[i] : null;
    if (local && (local._u || 0) >= u) return;
    if (row.deleted) { if (local) { next = { ...next, [row.coll]: arr.filter((x) => x.id !== row.id) }; changed = true; } return; }
    const rec = { ...row.data, id: row.id, _u: u }, a2 = arr.slice();
    if (i >= 0) a2[i] = rec; else a2.push(rec);
    next = { ...next, [row.coll]: a2 }; changed = true;
  });
  if (changed) emit(next);
  return changed;
}

export const subscribe = (f) => { listeners.add(f); return () => listeners.delete(f); };

/* ---------- accounts (Steam / PS5 / Switch 2 …) ----------
   Each account has its own games, sessions, goals and manual streaks (its own MR and history).
   Records carry `acct`; records saved before accounts existed have none and belong to the first account.
   Combos, reviews, tags and options are shared. Which account is showing is a per-device choice (ui.acct). */
export const DEFAULT_ACCOUNTS = [
  { id: 'steam', name: 'Steam', platform: 'Steam' },
  { id: 'ps5', name: 'PS5', platform: 'PS5' },
  { id: 'sw2', name: 'Switch 2', platform: 'Switch 2' },
];
const SCOPED = ['games', 'sessions', 'goals', 'streaks'];
export const accountsOf = (settings) => (settings && Array.isArray(settings.accounts) && settings.accounts.length ? settings.accounts : DEFAULT_ACCOUNTS);
export const curAcctId = () => { const l = accountsOf(state.settings), a = ui.acct; return l.some((x) => x.id === a) ? a : l[0].id; };
export const acctOfRec = (r, S) => r.acct || accountsOf((S || state).settings)[0].id;

let viewKey = null, viewVal = null;
function view() {
  const acct = curAcctId();
  if (viewVal && viewKey && viewKey.s === state && viewKey.a === acct) return viewVal;
  const first = accountsOf(state.settings)[0].id, v = { ...state, acct, accounts: accountsOf(state.settings) };
  SCOPED.forEach((c) => { v[c] = state[c].filter((r) => (r.acct || first) === acct); });
  viewKey = { s: state, a: acct }; viewVal = v;
  return v;
}
/** Everything the reads in the UI and actions see: the current account's records. */
export const getState = () => view();
/** All accounts' records (sync, backup, import). */
export const getRaw = () => state;
const subBoth = (f) => { const a = subscribe(f), b = subscribeUI(f); return () => { a(); b(); }; };
export const useLab = () => useSyncExternalStore(subBoth, view);
export const useRaw = () => useSyncExternalStore(subscribe, getRaw);

export function put(coll, id, data) {
  const u = Date.now();
  if (coll === 'settings') { emit({ ...state, settings: { ...data, _u: u } }); mark('settings', 'main'); return; }
  const arr = state[coll].slice(), row = { ...data, id, _u: u };
  if (SCOPED.includes(coll) && row.acct == null) row.acct = curAcctId();
  const i = arr.findIndex((x) => x.id === id);
  if (i >= 0) arr[i] = row; else arr.push(row);
  delete tomb[`${coll}/${id}`];
  emit({ ...state, [coll]: arr });
  mark(coll, id);
}
export function del(coll, id) {
  tomb[`${coll}/${id}`] = Date.now(); write(TOMB, tomb);
  emit({ ...state, [coll]: state[coll].filter((x) => x.id !== id) });
  mark(coll, id);
}
export function saveSettings(patch) { put('settings', 'main', { ...state.settings, ...patch }); }

/* ---------- per-device UI prefs (pane layout, drag pace, zoom) ---------- */
const UI0 = { acct: null, sel: null, scale: 100, pace: 8, space: 36, rat: {}, hts: {} };
let ui = { ...UI0, ...(typeof window === 'undefined' ? {} : read(UIK) || {}) };
ui.rat = ui.rat || {}; ui.hts = ui.hts || {};
const uiL = new Set();
export const getUI = () => ui;
export const subscribeUI = (f) => { uiL.add(f); return () => uiL.delete(f); };
export const useUI = () => useSyncExternalStore(subscribeUI, getUI);
export function setUI(patch) { ui = { ...ui, ...patch }; write(UIK, ui); uiL.forEach((f) => f()); }

export { ROSTER };
