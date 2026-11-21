// Site-wide, admin-published design tokens + custom CSS. Everyone loads the published row from
// Supabase (public read); only the admin account can write it (RLS). A copy is cached so the
// look applies instantly on the next visit, before the network answers.
// Supabase is loaded on demand so the main bundle stays light.
const client = async () => (await import('./lab/sync')).getSupabase();

export const ADMIN_USER_ID = 'b20d15f8-d5ec-4c8d-86b2-1596cf2a5946';
// SHA-256 of "sf6-admin:" + the admin password (the password itself is never stored in the repo).
// This is a soft gate for showing the tuner; real write protection is the database policy.
export const ADMIN_HASH = '92f6894f0851d3711cfe4511f4f4c270f6b798d60db4a3e27dc109170421c204';

const CACHE = 'sf6.site.cache';
const TAG = 'sf6-site-config';
let published = { vars: {}, css: '' };
const listeners = new Set();

export const getPublished = () => published;
export const onPublished = (f) => { listeners.add(f); return () => listeners.delete(f); };

function render(cfg) {
  published = { vars: cfg?.vars || {}, css: cfg?.css || '' };
  let tag = document.getElementById(TAG);
  if (!tag) { tag = document.createElement('style'); tag.id = TAG; document.head.prepend(tag); }
  const decl = Object.entries(published.vars).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  tag.textContent = `:root {\n${decl}\n}\n${published.css}`;
  listeners.forEach((f) => f(published));
}

export function applyCachedSite() {
  try { render(JSON.parse(localStorage.getItem(CACHE) || 'null')); } catch { render(null); }
}

export async function fetchSite() {
  try {
    const { data, error } = await (await client()).from('site_config').select('data').eq('id', 'main').maybeSingle();
    if (error || !data) return;
    render(data.data);
    try { localStorage.setItem(CACHE, JSON.stringify(data.data)); } catch { /* ignore */ }
  } catch { /* offline: cached/default look stays */ }
}

export async function publishSite(vars, css) {
  const sb = await client();
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sign in on the Tracker (admin email) first.');
  if (session.user.id !== ADMIN_USER_ID) throw new Error('This account is not the site admin.');
  const payload = { vars, css };
  const { error } = await sb.from('site_config').upsert({ id: 'main', data: payload, updated_at: new Date().toISOString(), updated_by: session.user.id });
  if (error) throw error;
  render(payload);
  try { localStorage.setItem(CACHE, JSON.stringify(payload)); } catch { /* ignore */ }
}

export async function adminAllowed() {
  // Hidden for any signed-in account that isn't the admin; signed-out devices rely on the password.
  const { data: { session } } = await (await client()).auth.getSession();
  return !session || session.user.id === ADMIN_USER_ID;
}

export async function checkPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`sf6-admin:${pw}`));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === ADMIN_HASH;
}
