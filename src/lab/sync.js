// Cloud sync for the Session Lab (Supabase). The app always works offline from
// localStorage; when you're signed in, changes are pushed and pulled so every
// device shows the same data. Conflict rule: newest write per record wins.
import { useSyncExternalStore } from 'react';
import { createClient } from '@supabase/supabase-js';
import { applyRemote, getDirty, clearDirty, getTomb, getState, onLocalChange, stampLocal } from './store';

// Public by design (RLS protects the data). Env vars override for other projects.
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://pagtnyoyfrwpvctnvxjv.supabase.co';
const KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_F-s2VLA0sikraRJ7Eema-w_JBuDPRvV';
const LAST = 'srst.pulled';

let sb = null;
const get = () => { if (!sb && typeof window !== 'undefined') sb = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); return sb; };

let st = { status: 'off', email: null, at: null, error: null }; // off | signing | idle | syncing | error
const L = new Set();
const set = (p) => { st = { ...st, ...p }; L.forEach((f) => f()); };
export const useSync = () => useSyncExternalStore((f) => { L.add(f); return () => L.delete(f); }, () => st);

let uid = null, chan = null, timer = null, busy = false, again = false;
const readLast = () => { try { return Number(window.localStorage.getItem(`${LAST}.${uid}`)) || 0; } catch { return 0; } };
const writeLast = (n) => { try { window.localStorage.setItem(`${LAST}.${uid}`, String(n)); } catch { /* ignore */ } };

async function pull(all) {
  const since = all ? 0 : readLast();
  const rows = []; let from = 0;
  for (;;) {
    const { data, error } = await get().from('lab_docs').select('coll,id,data,deleted,updated_at').gt('updated_at', since).order('updated_at').range(from, from + 999);
    if (error) throw error;
    rows.push(...data); if (data.length < 1000) break; from += 1000;
  }
  if (rows.length) { applyRemote(rows); writeLast(Math.max(...rows.map((r) => Number(r.updated_at)))); }
  return rows;
}

async function push() {
  const keys = getDirty(); if (!keys.length) return;
  const S = getState(), tomb = getTomb(), out = [];
  keys.forEach((k) => {
    const [coll, ...rest] = k.split('/'), id = rest.join('/');
    if (coll === 'settings') { const { _u, ...data } = S.settings; if (_u) out.push({ coll, id: 'main', data, deleted: false, updated_at: _u }); return; }
    const rec = (S[coll] || []).find((x) => x.id === id);
    if (rec) { const { id: _i, _u, ...data } = rec; out.push({ coll, id, data, deleted: false, updated_at: _u || Date.now() }); }
    else out.push({ coll, id, data: {}, deleted: true, updated_at: tomb[k] || Date.now() });
  });
  for (let i = 0; i < out.length; i += 500) {
    const { error } = await get().from('lab_docs').upsert(out.slice(i, i + 500).map((r) => ({ ...r, user_id: uid })), { onConflict: 'user_id,coll,id' });
    if (error) throw error;
  }
  clearDirty(keys);
}

export async function syncNow() {
  if (!uid) return;
  if (busy) { again = true; return; }
  busy = true; set({ status: 'syncing', error: null });
  try {
    const rows = await pull(false);
    stampLocal(!rows.some((r) => r.coll === 'settings'));
    await push();
    set({ status: 'idle', at: Date.now() });
  } catch (e) { set({ status: 'error', error: (e && e.message) || 'Sync failed' }); }
  busy = false;
  if (again) { again = false; syncNow(); }
}
const later = () => { clearTimeout(timer); timer = setTimeout(syncNow, 800); };

async function start(session) {
  if (!session || !session.user) return;
  if (uid === session.user.id) return;
  uid = session.user.id; set({ email: session.user.email, status: 'syncing' });
  await syncNow();
  chan = get().channel(`lab-${uid}`).on('postgres_changes', { event: '*', schema: 'public', table: 'lab_docs', filter: `user_id=eq.${uid}` }, (p) => {
    const r = p.new && p.new.coll ? p.new : null; if (!r) return;
    applyRemote([r]); writeLast(Math.max(readLast(), Number(r.updated_at)));
  }).subscribe();
}

let inited = false;
export function initSync() {
  if (inited || typeof window === 'undefined') return;
  inited = true;
  const c = get();
  c.auth.getSession().then(({ data }) => start(data.session));
  c.auth.onAuthStateChange((ev, session) => {
    if (session) start(session);
    else if (ev === 'SIGNED_OUT') { uid = null; if (chan) { c.removeChannel(chan); chan = null; } set({ status: 'off', email: null, at: null }); }
  });
  onLocalChange(() => { if (uid) later(); });
  window.addEventListener('online', () => { if (uid) syncNow(); });
  window.addEventListener('focus', () => { if (uid) syncNow(); });
}

export async function signIn(email) {
  set({ status: 'signing', error: null });
  const { error } = await get().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/tracker` } });
  if (error) { set({ status: 'off', error: error.message }); return false; }
  set({ status: 'off' });
  return true;
}
export async function verifyCode(email, token) {
  const { error } = await get().auth.verifyOtp({ email, token, type: 'email' });
  if (error) { set({ error: error.message }); return false; }
  return true;
}
export async function signOut() { await get().auth.signOut(); }
