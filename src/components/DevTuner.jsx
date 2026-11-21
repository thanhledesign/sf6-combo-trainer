import React, { useEffect, useState } from 'react';
import { Settings, X, RotateCcw, Copy } from 'lucide-react';

// Dev-only visual CSS tuner. Edits the design tokens in index.css (:root) live, persists them in
// localStorage, and can emit the CSS to paste back. Hidden unless turned on:
//   - add ?dev=1 to any URL (stays on), or press Ctrl/Cmd+Shift+D to toggle, or use "Hide cog" in the panel.
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
  const [enabled, setEnabled] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).get('dev') === '1') localStorage.setItem(FLAG, '1');
      return localStorage.getItem(FLAG) === '1';
    } catch { return false; }
  });
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState(() => read(KEY, {}));
  const [custom, setCustom] = useState(() => read(CUSTOM, ''));

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
        setEnabled((on) => {
          const next = !on;
          try { localStorage.setItem(FLAG, next ? '1' : '0'); } catch { /* ignore */ }
          if (!next) setOpen(false);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const set = (name, value) => setVals((p) => { const n = { ...p, [name]: value }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  const reset = () => { setVals({}); setCustom(''); try { localStorage.removeItem(KEY); localStorage.removeItem(CUSTOM); } catch { /* ignore */ } };
  const hide = () => { setEnabled(false); setOpen(false); try { localStorage.setItem(FLAG, '0'); } catch { /* ignore */ } };
  const saveCustom = (t) => { setCustom(t); try { localStorage.setItem(CUSTOM, JSON.stringify(t)); } catch { /* ignore */ } };
  const css = () => {
    const lines = CONTROLS.flatMap((g) => g.items).filter((c) => vals[c.v] !== undefined).map((c) => `  ${c.v}: ${fmt(c, vals[c.v])};`);
    return `:root {\n${lines.join('\n')}\n}${custom ? `\n\n${custom}` : ''}`;
  };

  if (!enabled) return null;
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
                const val = vals[c.v] ?? c.def;
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
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigator.clipboard?.writeText(css())} className="btn-secondary btn-sm"><Copy className="h-3.5 w-3.5" />Copy CSS</button>
            <button onClick={reset} className="btn-secondary btn-sm"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
            <button onClick={hide} className="btn-secondary btn-sm">Hide cog</button>
          </div>
          <p className="mt-3 text-[10px] text-gray-500">Turn back on: Ctrl/Cmd+Shift+D or add ?dev=1 to the URL. Tweaks are saved on this device only.</p>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} aria-label="Open CSS tuner" className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-700 bg-gray-900/95 text-gray-200 shadow-xl hover:text-white">
          <Settings className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
