import { useState } from 'react';
import { useLab } from '../../lab/store';
import { planOf, planIdx, themeList, themeName, themeTip } from '../../lab/calc';
import { setPlanSlot, setThemeNote, resetPlan } from '../../lab/useLabActions';
import { Overlay } from './ui';

const SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/** Live plan bar: pick game and round, see the planned theme and its reminder, swap in one tap. */
export function PlanBar({ g, r, setG, setR, onEdit }) {
  const S = useLab();
  const [open, setOpen] = useState(false);
  const idx = planIdx(g, r), key = planOf(S)[idx], tip = themeTip(S, key);
  const [note, setNote] = useState(null);
  return (
    <div className="planbar">
      <div className="planrow">
        <span className="plan-l">G</span>
        {[1, 2, 3].map((n) => <button key={n} type="button" className="chip" aria-pressed={g === n} onClick={() => setG(n)}>{n}</button>)}
        <span className="plan-l">R</span>
        {[1, 2, 3].map((n) => <button key={n} type="button" className="chip" aria-pressed={r === n} onClick={() => setR(n)}>{n}</button>)}
        <button type="button" className="mini" style={{ marginLeft: 'auto' }} onClick={onEdit}>Edit plan</button>
      </div>
      <button type="button" className="plan-cur" aria-expanded={open} onClick={() => { setOpen((v) => !v); setNote(null); }}>
        <b>{themeName(S, key)}</b><span className="mute">{tip}</span><i aria-hidden="true">{open ? '▴' : 'swap ▾'}</i>
      </button>
      {open && (
        <div className="plan-swap">
          <div className="chips" style={{ maxHeight: 'none' }}>
            {themeList(S).map((t) => <button key={t[0]} type="button" className="chip" aria-pressed={t[0] === key} onClick={() => { setPlanSlot(idx, t[0]); setOpen(false); }}>{t[1]}</button>)}
          </div>
          <label className="plan-note">Reminder for this theme
            <input type="text" value={note != null ? note : tip} onChange={(e) => setNote(e.target.value)} onBlur={() => { if (note != null) { setThemeNote(key, note); setNote(null); } }} />
          </label>
        </div>
      )}
    </div>
  );
}

/** Full 3x3 editor, used before a session and mid session. */
export function PlanEditor({ onClose }) {
  const S = useLab(), plan = planOf(S), list = themeList(S);
  return (
    <Overlay onClose={onClose} wide>
      <div className="plan-ed">
        <h2>Game plan</h2>
        <p className="mute">Pick the theme for each round. Changes save at once and apply to the live session.</p>
        <div className="plan-grid">
          {[1, 2, 3].map((g) => (
            <div key={g} className="plan-col">
              <b>Game {g}</b>
              {[1, 2, 3].map((r) => {
                const i = planIdx(g, r), k = plan[i];
                return (
                  <label key={r}>R{r}
                    <select value={k} onChange={(e) => setPlanSlot(i, e.target.value)}>
                      {!list.some((t) => t[0] === k) && <option value={k}>{k}</option>}
                      {list.map((t) => <option key={t[0]} value={t[0]}>{t[1]}</option>)}
                    </select>
                    <small className="mute">{themeTip(S, k)}</small>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <div className="row2" style={{ marginTop: '.6rem' }}>
          <button type="button" className="btn" onClick={() => { if (window.confirm('Reset the plan and reminders to the defaults?')) resetPlan(); }}>Reset to defaults</button>
          <button type="button" className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </Overlay>
  );
}
