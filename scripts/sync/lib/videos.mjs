// Shared helpers for the move-video tools (pure functions + Supabase Storage upload).

export const BUCKET = 'move-videos';
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pagtnyoyfrwpvctnvxjv.supabase.co';

export const normalizeName = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const slug = (s) => normalizeName(s).replace(/\s+/g, '_');

// File name convention: <character>_<move name>.<ext>, e.g. ken_chin_buster.mp4
export const clipName = (char, move, ext = 'mp4') => `${char}_${slug(move)}.${ext}`;

// Capcom frame-table names carry prefixes the movelist doesn't ("L Hadoken", "SA1 X", "[Quick Dash] X").
const stripPrefix = (n) =>
  String(n).toLowerCase().replace(/^\[(?:quick dash|after [^\]]+)\]\s+/i, '')
   .replace(/^(?:sa[123]|ca|od|critical art)\s+/i, '')
   .replace(/^[lmh]\s+/, '')
   .trim();
const stripQualifier = (n) => n.replace(/\s*\([^)]+\)\s*$/, '').trim();

// All normalized keys a frame-data move can be known by.
export function moveKeys(displayName) {
  const full = normalizeName(displayName);
  const noPrefix = normalizeName(stripPrefix(displayName));
  const noQual = normalizeName(stripQualifier(stripPrefix(displayName)));
  const beforeColon = normalizeName(String(displayName).split(':')[0]);
  return [...new Set([full, noPrefix, noQual, beforeColon].filter(Boolean))];
}

// entries: [{ name, url }] from the movelist page.  capcomMoves: { moveId: { displayName } }.
// Returns { moves: { moveId: { name, url } }, unmatched: [entries], noVideo: [moveIds] }.
export function matchVideos(entries, capcomMoves) {
  const byKey = new Map();
  for (const [moveId, m] of Object.entries(capcomMoves || {})) {
    for (const k of moveKeys(m.displayName)) {
      if (!byKey.has(k)) byKey.set(k, new Set());
      byKey.get(k).add(moveId);
    }
  }
  const moves = {};
  const unmatched = [];
  for (const e of entries) {
    const keys = moveKeys(e.name);
    const ids = new Set();
    for (const k of keys) (byKey.get(k) || []).forEach((id) => ids.add(id));
    if (!ids.size) { unmatched.push(e); continue; }
    for (const id of ids) if (!moves[id]) moves[id] = { name: e.name, url: e.url };
  }
  const noVideo = Object.keys(capcomMoves || {}).filter((id) => !moves[id]);
  return { moves, unmatched, noVideo };
}

export const publicUrl = (path) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

// Upload a Buffer to Supabase Storage (needs the service-role key; never ship it to the browser).
export async function uploadToStorage(path, buf, contentType = 'video/mp4', key = process.env.SUPABASE_SERVICE_KEY) {
  if (!key) throw new Error('SUPABASE_SERVICE_KEY not set');
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': contentType, 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' },
    body: buf,
  });
  if (!res.ok) throw new Error(`upload ${path} → ${res.status} ${(await res.text()).slice(0, 120)}`);
  return publicUrl(path);
}

// Runs INSIDE the browser (via page.evaluate): reads each movelist row's name + video URL.
export function extractRows(reSrc) {
  const re = new RegExp(reSrc, 'i');
  const abs = (u) => { try { return new URL(u, location.href).href; } catch { return null; } };
  const rows = Array.from(document.querySelectorAll('li[class*="movelist"]'));
  return rows.map((li) => {
    const name = li.querySelector('[class*="movelist_arts"]')?.textContent.trim();
    if (!name) return null;
    const cands = [];
    li.querySelectorAll('video, video source').forEach((v) => { cands.push(v.currentSrc, v.getAttribute('src'), v.getAttribute('data-src')); });
    // Any attribute anywhere in the row whose value looks like a video file (src, data-src, href, ...).
    const isVid = /\.(?:mp4|webm|mov)(?:[?#]|$)/i;
    li.querySelectorAll('*').forEach((el) => { for (const a of el.attributes) if (isVid.test(a.value)) cands.push(a.value); });
    const m = li.outerHTML.match(re); if (m) cands.push(m[0]);
    const url = cands.map((c) => c && abs(c)).find((c) => c && isVid.test(c)) || null;
    return { name, url, html: li.outerHTML.slice(0, 1500) };
  }).filter(Boolean);
}
