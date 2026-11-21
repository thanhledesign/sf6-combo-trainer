// Small shared pieces for the Session Lab screens.
import { useEffect, useRef, useState } from 'react';
import { useToastMsg } from './toastBus';
import { useScrub } from './useScrub';
import { clamp, num } from '../../lab/calc';
import { thumbOf } from '../../lab/data';

export function Toast() {
  const m = useToastMsg();
  return <div id="toast" role="status" style={{ display: m ? 'block' : 'none' }}>{m}</div>;
}

/* ---------- icons ---------- */
const SVG_ATTR = { viewBox: '0 0 36 32', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const ICONS = {
  Pad: '<path d="M9 10h18c3 0 5 2 6 7l1 6c.4 2.4-2 4-4 2.5L25 21H11l-5 4.5C4 27 1.6 25.4 2 23l1-6c1-5 3-7 6-7z"/><path d="M10 14v5M7.5 16.5h5"/><circle cx="24" cy="14.5" r="1" fill="currentColor"/><circle cx="27" cy="17.5" r="1" fill="currentColor"/>',
  Stick: '<ellipse cx="18" cy="25" rx="12" ry="4"/><path d="M18 22V11"/><circle cx="18" cy="8" r="5" fill="currentColor"/>',
  Hitbox: '<rect x="1.5" y="6" width="33" height="20" rx="3"/><g fill="currentColor" stroke="none"><circle cx="6" cy="19" r="1.7"/><circle cx="10.5" cy="21.5" r="1.7"/><circle cx="15" cy="19" r="1.7"/><circle cx="20" cy="12" r="1.7"/><circle cx="24" cy="11.5" r="1.7"/><circle cx="28" cy="11.5" r="1.7"/><circle cx="32" cy="12.5" r="1.7"/><circle cx="20.5" cy="18.5" r="1.7"/><circle cx="24.5" cy="18" r="1.7"/><circle cx="28.5" cy="18" r="1.7"/><circle cx="32" cy="19" r="1.7"/></g>',
  log: '<path d="M5 27l1.5-6L24 3.5l5 5L11.5 26z"/><path d="M20 8l5 5"/>',
  dash: '<rect x="4" y="4" width="11" height="11" rx="2"/><rect x="20" y="4" width="11" height="11" rx="2"/><rect x="4" y="18" width="11" height="11" rx="2"/><rect x="20" y="18" width="11" height="11" rx="2"/>',
  hist: '<circle cx="18" cy="16" r="12"/><path d="M18 8v8l5 3"/>',
  combos: '<circle cx="6" cy="22" r="3"/><circle cx="18" cy="10" r="3"/><circle cx="30" cy="22" r="3"/><path d="M8.5 20l7-8M20.5 12l7 8"/>',
  review: '<rect x="4" y="5" width="28" height="19" rx="3"/><path d="M15 10.5l7 4-7 4z" fill="currentColor"/><path d="M10 28h16"/>',
  goals: '<circle cx="18" cy="16" r="12"/><circle cx="18" cy="16" r="7"/><circle cx="18" cy="16" r="2" fill="currentColor"/>',
  opts: '<path d="M4 8h28M4 16h28M4 24h28"/><circle cx="12" cy="8" r="3" fill="var(--panel2)"/><circle cx="24" cy="16" r="3" fill="var(--panel2)"/><circle cx="14" cy="24" r="3" fill="var(--panel2)"/>',
};
export const Icon = ({ name }) => <svg {...SVG_ATTR} dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />;

/** Drag-to-change number. `value` may be null (shows –); `base` is the starting point when null. */
export function MrScrub({ id, label, value, base, onChange, pace, min = 0, max = 3000 }) {
  const ref = useRef(null);
  const [editing, setEditing] = useState(false);
  useScrub(ref, { axis: 'y', min, max, pace, get: () => (value != null ? value : base), set: onChange, onTap: () => setEditing(true) });
  const fin = (ok, v) => { setEditing(false); if (ok) { const n = num(v); if (n != null) onChange(clamp(n, min, max)); } };
  return (
    <div id={id} ref={ref} className={`scrub${editing ? ' editing' : ''}`} role="spinbutton" tabIndex={0} aria-label={label} aria-valuenow={value ?? undefined}>
      {editing
        ? <input type="number" inputMode="numeric" aria-label="Type a value" defaultValue={value ?? base} autoFocus
            onFocus={(e) => e.target.select()} onBlur={(e) => fin(true, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fin(true, e.target.value); else if (e.key === 'Escape') fin(false); }} />
        : <><span className="val">{value == null ? '–' : value}</span><span className="hint">drag</span></>}
    </div>
  );
}

/** 1–5 bar you can drag sideways or tap. */
export function Scale({ k, label, hint, value, onChange, pace }) {
  const ref = useRef(null), bars = useRef(null);
  useScrub(ref, { axis: 'x', min: 1, max: 5, pace, get: () => value, set: onChange });
  const click = (e) => {
    if (ref.current.__dragged) { ref.current.__dragged = false; return; }
    const r = bars.current.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || r.width <= 0) return;
    onChange(clamp(Math.floor(((e.clientX - r.left) / r.width) * 5) + 1, 1, 5));
  };
  return (
    <div className="scale" data-k={k} ref={ref} tabIndex={0} onClick={click}>
      <span className="lbl">{label}<small>{hint}</small></span>
      <span className="bars" ref={bars}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= value ? 'on' : ''} />)}</span>
      <span className="n">{value}</span>
    </div>
  );
}

export function Stepper({ value, onDec, onInc, suffix = '' }) {
  return (
    <div className="step">
      <button type="button" onClick={onDec} aria-label="Decrease">−</button>
      <b>{value}{suffix}</b>
      <button type="button" onClick={onInc} aria-label="Increase">+</button>
    </div>
  );
}

export function Overlay({ children, onClose, wide }) {
  useEffect(() => {
    if (!onClose) return undefined;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return <div className="overlay"><div className="card" style={wide ? { maxWidth: '44rem' } : undefined}>{children}</div></div>;
}

const hue = (c) => { let h = 0; for (let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) % 360; return h; };
const initials = (c) => { const p = c.split(/[\s.-]+/).filter(Boolean); return (p.length > 1 ? p.map((x) => x[0]).join('') : c.slice(0, 2)).toUpperCase(); };
export function Tile({ c, pressed, badge, onClick, as }) {
  const im = thumbOf(c);
  return (
    <button type="button" className={`optile${im ? ' has-img' : ''}`} aria-pressed={pressed} aria-label={c} onClick={onClick} data-as={as}
      style={{ '--h': hue(c), ...(im ? { backgroundImage: `url('${im}')` } : {}) }}>
      <span className="ini">{initials(c)}</span><span className="nm">{c}</span><span className="bd">{badge || ''}</span>
    </button>
  );
}

export function TagChips({ tags, sel, onToggle, extra }) {
  return (
    <>
      {tags.map((t) => (
        <button key={t[0]} type="button" className={`chip ${t[2]}`} aria-pressed={!!sel[t[0]]} onClick={() => onToggle(t[0])}>{t[1]}</button>
      ))}
      {extra}
    </>
  );
}

export const Table = ({ head, rows }) => (
  <div className="tw"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
);
