import React, { useEffect, useState } from 'react';
import { Settings, X, Copy, Lock, UploadCloud, Undo2 } from 'lucide-react';
import { adminAllowed, checkPassword, getPublished, onPublished, publishSite } from '../siteConfig';

// Admin-only visual CSS tuner. Edits the design tokens in index.css (:root) live (a local draft only
// you see), and "Publish site-wide" saves them to Supabase so every visitor gets the same look.
// Hidden for everyone: Ctrl/Cmd+Shift+D (or ?dev=1) asks for the admin password; a signed-in account
// that isn't the admin never sees it, and only the admin account can write the published config.
const FLAG = 'sf6.dev';
const KEY = 'sf6.devcss';
const CUSTOM = 'sf6.devcss.custom';

const CONTROLS = [
  { group: 'Buttons', items: [
    { v: '--btn-from', label: 'Gradient start', type: 'color', def: '#7c3aed' },
    { v: '--btn-to', label: 'Gradient end', type: 'color', def: '#4f46e5' },
    { v: '--btn-angle', label: 'Gradient angle', type: 'range', min: 0, max: 360, step: 5, unit: 'deg', def: 135 },
    { v: '--btn-radius', label: 'Corner radius', type: 'range', min: 0, max: 28, step: 1, unit: 'px', def: 12 },
    { v: '--btn-weight', label: 'Font weight', type: 'range', min: 400, max: 800, step: 100, unit: '', def: 600 },
    { v: '--btn-py', label: 'Padding Y', type: 'range', min: 4, max: 24, step: 1, unit: 'px', def: 12 },
    { v: '--btn-px', label: 'Padding X', type: 'range', min: 8, max: 40, step: 1, unit: 'px', def: 16 },
    { v: '--btn-secondary-bg', label: 'Secondary bg', type: 'color', def: '#1f2937' },
    { v: '--btn-secondary-hover', label: 'Secondary hover', type: 'color', def: '#374151' },
  ] },
  { group: 'Typography', items: [
    { v: '--font-scale', label: 'Site text scale', type: 'range', min: 0.8, max: 1.3, step: 0.05, unit: '', def: 1 },
  ] },
  { group: 'Cards', items: [
    { v: '--card-radius', label: 'Card radius', type: 'range', min: 0, max: 40, step: 1, unit: 'px', def: 16 },
    { v: '--art-tint', label: 'Art gradient tint', type: 'range', min: 0, max: 1, step: 0.05, unit: '', def: 0.8 },
  ] },
];

const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const fmt = (c, val) => `${val}${c.unit || ''}`;
const apply = (vals) => {
  const root = document.documentElement.style;
  CONTROLS.forEach((g) => g.items.forEach((c) => {
    if (vals[c.v] === undefined) root.removeProperty(c.v);
    else root.setProperty(c.v, fmt(c, vals[c.v]));
  }));
};

export default function DevTuner() {
  const [enabled, setEnabled] = useState(() => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } });
  const [asking, setAsking] = useState(() => { try { return new URLSearchParams(window.location.search).get('dev') === '1' && localStorage.getItem(FLAG) !== '1'; } catch { return false; } });
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [allowed, setAllowed] = useState(true);
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState(() => read(KEY, {}));
  const [custom, setCustom] = useState(() => read(CUSTOM, null) ?? getPublished().css);
  const [pub, setPub] = useState(getPublished);
  useEffect(() => onPublished((p) => { setPub(p); if (localStorage.getItem(CUSTOM) === null) setCustom(p.css); }), []);
  useEffect(() => { if (enabled) adminAllowed().then(setAllowed).catch(() => setAllowed(true)); }, [enabled]);

  // Saved tweaks apply on every load, even with the cog hidden.
  useEffect(() => { apply(vals); }, [vals]);
  useEffect(() => {
    let tag = document.getElementById('sf6-dev-custom-css');
    if (!tag) { tag = document.createElement('style'); tag.id = 'sf6-dev-custom-css'; document.head.appendChild(tag); }
    tag.textContent = custom;
  }, [custom]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (enabled) { setEnabled(false); setOpen(false); try { localStorage.setItem(FLAG, '0'); } catch { /* ignore */ } }
        else setAsking(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  const set = (name, value) => setVals((p) => { const n = { ...p, [name]: value }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const reset = () => { setVals({}); setCustom(''); try { localStorage.removeItem(KEY); localStorage.removeItem(CUSTOM); } catch { /* ignore */ } };
  const unlock = async (e) => {
    e.preventDefault();
    if (await checkPassword(pw)) {
      try { localStorage.setItem(FLAG, '1'); } catch { /* ignore */ }
      setEnabled(true); setAsking(false); setPw(''); setPwErr('');
    } else setPwErr('Wrong password');
  };
  const publish = async () => {
    setStatus('Publishing…');
    try {
      const merged = { ...pub.vars };
      CONTROLS.flatMap((g) => g.items).forEach((c) => { if (vals[c.v] !== undefined) merged[c.v] = fmt(c, vals[c.v]); });
      await publishSite(merged, custom);
      setVals({}); try { localStorage.removeItem(KEY); localStorage.removeItem(CUSTOM); } catch { /* ignore */ }
      setCustom('');
      setStatus('Published — live for everyone.');
    } catch (err) { setStatus(err.message || 'Publish failed'); }
  };
  const revert = () => { reset(); setStatus('Back to the published look.'); };
  const hide = () => { setEnabled(false); setOpen(false); try { localStorage.setItem(FLAG, '0'); } catch { /* ignore */ } };
  const saveCustom = (t) => { setCustom(t); try { localStorage.setItem(CUSTOM, JSON.stringify(t)); } catch { /* ignore */ } };
  const css = () => {
    const lines = CONTROLS.flatMap((g) => g.items).filter((c) => vals[c.v] !== undefined).map((c) => `  ${c.v}: ${fmt(c, vals[c.v])};`);
    return `:root {\n${lines.join('\n')}\n}${custom ? `\n\n${custom}` : ''}`;
  };

  const shown = (c) => {
    if (vals[c.v] !== undefined) return vals[c.v];
    const p = pub.vars[c.v];
    if (p === undefined) return c.def;
    return c.type === 'color' ? p : parseFloat(p);
  };

  if (asking && !enabled) {
    return (
      <form onSubmit={unlock} className="fixed bottom-4 right-4 z-[9999] flex w-72 flex-col gap-2 rounded-xl border border-gray-700 bg-gray-900/95 p-4 text-gray-200 shadow-2xl">
        <span className="flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4" />Admin</span>
        <input autoFocus type="password" value={pw} onChange={(e) => { setPw(e.target.value); setPwErr(''); }} placeholder="Admin password" className="rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white" />
        {pwErr && <span className="text-xs text-red-400">{pwErr}</span>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary btn-sm flex-1">Unlock</button>
          <button type="button" onClick={() => { setAsking(false); setPw(''); setPwErr(''); }} className="btn-secondary btn-sm">Cancel</button>
        </div>
      </form>
    );
  }
  if (!enabled || !allowed) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      {open ? (
        <div className="w-80 max-h-[80vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900/95 p-4 text-gray-200 shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Dev: CSS tuner</span>
            <button onClick={() => setOpen(false)} aria-label="Close tuner" className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          {CONTROLS.map((g) => (
            <div key={g.group} className="mb-4">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{g.group}</h4>
              {g.items.map((c) => {
                const val = shown(c);
                return (
                  <label key={c.v} className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="w-28 shrink-0 text-gray-300">{c.label}</span>
                    {c.type === 'color' ? (
                      <input type="color" value={val} onChange={(e) => set(c.v, e.target.value)} className="h-7 w-full cursor-pointer rounded border border-gray-700 bg-transparent" />
                    ) : (
                      <span className="flex w-full items-center gap-2">
                        <input type="range" min={c.min} max={c.max} step={c.step} value={val} onChange={(e) => set(c.v, Number(e.target.value))} className="w-full" />
                        <span className="w-9 text-right tabular-nums text-gray-400">{val}</span>
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          ))}
          <div className="mb-3 flex gap-2">
            <button className="btn-primary btn-sm">Primary</button>
            <button className="btn-secondary btn-sm">Secondary</button>
          </div>
          <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Custom CSS (live)</h4>
          <textarea value={custom} onChange={(e) => saveCustom(e.target.value)} spellCheck={false} placeholder=".btn-primary { text-transform: uppercase; }" rows={4} className="mb-3 w-full rounded border border-gray-700 bg-gray-950 p-2 font-mono text-[11px] text-gray-200" />
          <button onClick={publish} className="btn-primary btn-sm mb-2 w-full"><UploadCloud className="h-4 w-4" />Publish site-wide</button>
          {status && <p className="mb-2 text-xs text-purple-300">{status}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={revert} className="btn-secondary btn-sm"><Undo2 className="h-3.5 w-3.5" />Revert draft</button>
            <button onClick={() => navigator.clipboard?.writeText(css())} className="btn-secondary btn-sm"><Copy className="h-3.5 w-3.5" />Copy CSS</button>
            <button onClick={hide} className="btn-secondary btn-sm">Hide cog</button>
          </div>
          <p className="mt-3 text-[10px] text-gray-500">Edits are a draft only you see until you Publish. Publishing needs you signed in on the Tracker with the admin email. Show/hide: Ctrl/Cmd+Shift+D.</p>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} aria-label="Open CSS tuner" className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900/95 text-gray-200 shadow-xl hover:text-white">
          <Settings className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
