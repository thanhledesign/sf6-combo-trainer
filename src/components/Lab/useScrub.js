// Pointer/wheel/keyboard drag engine: vertical for MR values, horizontal for 1–5 scales.
import { useEffect, useLayoutEffect, useRef } from 'react';
import { clamp } from '../../lab/calc';

/* ---------- pointer drag: vertical for MR, horizontal for scales ---------- */
export function useScrub(ref, opt) {
  const o = useRef(opt);
  useLayoutEffect(() => { o.current = opt; });
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    let sx = 0, sy = 0, v0 = 0, down = false, drag = false;
    const pd = (e) => {
      if ((e.button || 0) > 0 || el.classList.contains('editing')) return;
      down = true; drag = false; el.__dragged = false; sx = e.clientX; sy = e.clientY; v0 = o.current.get();
      try { el.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    };
    const pm = (e) => {
      if (!down) return;
      if (!drag && Math.hypot(e.clientX - sx, e.clientY - sy) < 5) return;
      drag = true; if (e.cancelable) e.preventDefault();
      const c = o.current, d = c.axis === 'x' ? e.clientX - sx : sy - e.clientY;
      let p = c.pace; if (e.shiftKey) p = Math.max(1, p / 5);
      c.set(clamp(v0 + Math.trunc(d / p), c.min, c.max));
    };
    const pu = () => { const was = down && !drag; el.__dragged = drag; down = false; if (was && o.current.onTap) o.current.onTap(); };
    const wh = (e) => { e.preventDefault(); const c = o.current; c.set(clamp(c.get() + (e.deltaY < 0 ? 1 : -1), c.min, c.max)); };
    const kd = (e) => {
      const c = o.current, k = e.key, st = e.shiftKey ? 10 : 1;
      if (k === 'ArrowUp' || k === 'ArrowRight') { e.preventDefault(); c.set(clamp(c.get() + st, c.min, c.max)); }
      else if (k === 'ArrowDown' || k === 'ArrowLeft') { e.preventDefault(); c.set(clamp(c.get() - st, c.min, c.max)); }
      else if (k === 'Enter' && c.onTap) c.onTap();
    };
    const cancel = () => { down = false; };
    el.addEventListener('pointerdown', pd); el.addEventListener('pointermove', pm);
    el.addEventListener('pointerup', pu); el.addEventListener('pointercancel', cancel);
    el.addEventListener('wheel', wh, { passive: false }); el.addEventListener('keydown', kd);
    return () => {
      el.removeEventListener('pointerdown', pd); el.removeEventListener('pointermove', pm);
      el.removeEventListener('pointerup', pu); el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('wheel', wh); el.removeEventListener('keydown', kd);
    };
  }, [ref]);
}

