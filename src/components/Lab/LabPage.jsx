// V01.33 Session Lab — native page. Header (character, device, panes) + up to three
// resizable panes: Log, Live, History, Goals, Combos, Review, Options.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { availableCharacterIds } from '../../data/characters/loader';
import { useLab, useUI, getUI, setUI } from '../../lab/store';
import { meNow, devNow, toCsv, lastGame, opts } from '../../lab/calc';
import { ROSTER, DEVICES, nameToCharId } from '../../lab/data';
import { setDevice, setMe, syncGoals, lockState, lockSave, lockEnd, toggleFocus } from '../../lab/useLabActions';
import { toast } from './toastBus';
import { Icon, Overlay, Tile, Toast } from './ui';
import LogPane from './LogPane';
import { DashPane, HistPane, GoalsPane, EditGameModal, GoalModal } from './StatsPanes';
import { OptionsPane, TagManager, CsvModal } from './OptionsPane';
import ReviewPane from './ReviewPane';
import CombosPane from './CombosPane';
import ProfileCard from './ProfileCard';
import AccountSwitcher from './AccountSwitcher';
import SyncModal from './SyncModal';
import { initSync, useSync } from '../../lab/sync';
import './lab.css';

const PANES = ['log', 'dash', 'hist', 'goals', 'combos', 'review', 'opts'];
const PLBL = { log: 'Log', dash: 'Live', hist: 'History', goals: 'Goals', combos: 'Combos', review: 'Review', opts: 'Options' };

function LockModal({ S }) {
  const L = lockState(S), [note, setNote] = useState('');
  if (!L) return null;
  const save = () => { if (note.trim().length < opts(S).lockMin) { toast('Write a full situation first'); return; } lockSave(note.trim()); setNote(''); };
  return (
    <Overlay>
      <h2 className="warn">{L.N} losses in a row. Stop.</h2>
      <p>Write the one situation that beat you. Then you can queue again.</p>
      <textarea aria-label="Situation that beat me" placeholder="When ___ happened, I did ___ instead of ___" style={{ minHeight: '6rem' }} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="row2" style={{ marginTop: '.6rem' }}><button type="button" className="btn primary" onClick={save}>Save and continue</button><button type="button" className="btn" onClick={lockEnd}>End session</button></div>
    </Overlay>
  );
}

export default function LabPage({ pane = 'log' }) {
  const S = useLab(), ui = useUI(), navigate = useNavigate();
  const sync = useSync(), [syncOpen, setSyncOpen] = useState(false);
  const [edit, setEdit] = useState(null), [goal, setGoal] = useState(null), [tags, setTags] = useState(false), [csv, setCsv] = useState(null), [pick, setPick] = useState(false);
  const me = meNow(S), dev = devNow(S);
  const boxRef = useRef(null), [narrow, setNarrow] = useState(false);

  const study = useCallback((name) => {
    const id = nameToCharId(name, availableCharacterIds);
    navigate(id ? `/browse/${id}` : '/characters');
  }, [navigate]);

  // Route → panes. Runs on every navigation (location.key changes even when the
  // URL is the same, e.g. clicking "Review" while already on Review with a split
  // layout). On first load a saved layout that already contains the pane is kept;
  // after that a nav click always lands on exactly what it names:
  //   /tracker → Log (plus whatever it was already split with), /tracker/review → Review, /tracker/combos → Combos.
  const loc = useLocation(), seen = useRef(false), fromTabs = !!(loc.state && loc.state.tabs);
  useEffect(() => {
    const cur0 = getUI().sel, force = seen.current; seen.current = true;
    if (fromTabs) return; // the layout was changed by the pane tabs themselves
    if (pane === 'log') {
      if (!cur0 || !cur0.length) setUI({ under: [], sel: window.innerWidth >= 1100 ? ['log', 'dash'] : ['log'] });
      else if (!cur0.includes('log')) setUI({ under: [], sel: force ? ['log'] : ['log', ...cur0].slice(0, 3) });
    } else if (force || !cur0 || !cur0.includes(pane)) setUI({ under: [], sel: [pane] });
  }, [pane, loc.key, fromTabs]);
  useEffect(() => { initSync(); }, []);
  useEffect(() => { try { syncGoals(); } catch { /* ignore */ } }, [S.games, S.goals]);
  useEffect(() => {
    const f = () => setTags(true); window.addEventListener('lab:tags', f); return () => window.removeEventListener('lab:tags', f);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(max-width:900px)') : null; if (!mq) return undefined;
    const f = () => setNarrow(mq.matches); f(); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f);
  }, []);

  // Pane order is the order in `sel` (the user can rearrange it), not the tab order.
  const sel = [...new Set((ui.sel && ui.sel.length ? ui.sel : ['log']).filter((p) => PANES.includes(p)))];
  // Panes live in columns; a pane in ui.under is tucked beneath the pane before it (same column).
  const under = ui.under || [];
  const colsDesk = [];
  sel.forEach((p) => { if (under.includes(p) && colsDesk.length) colsDesk[colsDesk.length - 1].push(p); else colsDesk.push([p]); });
  const cols = narrow ? sel.map((p) => [p]) : colsDesk;
  const vis = sel, sig = cols.map((c) => c.join('+')).join(',');
  const MAXCOL = 3;
  const flat = (cs) => ({ sel: cs.flat(), under: cs.flatMap((c) => c.slice(1)) });
  // Apply a new column layout, carrying each column's width with its first pane.
  const setCols = (next) => {
    const old = ((getUI().rat || {})[sig] || []), w = {};
    cols.forEach((c, i) => { w[c[0]] = old[i] > 0 ? old[i] : 1; });
    const f = flat(next);
    setUI({ ...f, rat: { ...getUI().rat, [next.map((c) => c.join('+')).join(',')]: next.map((c) => w[c[0]] || 1) } });
  };
  const toggle = (p) => {
    let cs = colsDesk.map((c) => c.slice());
    const ci = cs.findIndex((c) => c.includes(p));
    if (ci >= 0) { if (sel.length > 1) { cs[ci] = cs[ci].filter((x) => x !== p); if (!cs[ci].length) cs.splice(ci, 1); } }
    else { cs.push([p]); while (cs.length > MAXCOL) cs.shift(); }
    setUI(flat(cs));
    // keep the URL (and the app nav highlight) in step with what's showing
    const a = flat(cs).sel;
    const url = a.length === 1 && a[0] === 'review' ? '/tracker/review' : a.length === 1 && a[0] === 'combos' ? '/tracker/combos' : '/tracker';
    if (url !== loc.pathname) navigate(url, { replace: true, state: { tabs: true } });
  };

  // ratios between panes
  const ratios = (n) => { const r = ((ui.rat || {})[sig] || []).slice(0, n); for (let i = 0; i < n; i++) if (!(r[i] > 0)) r[i] = 1; return r; };
  useLayoutEffect(() => {
    const box = boxRef.current; if (!box) return;
    const n = cols.length;
    if (n < 2) { box.style.gridTemplateColumns = ''; box.style.gridTemplateRows = ''; return; }
    const r = ratios(n), t = []; r.forEach((x, i) => { if (i) t.push('.6rem'); t.push(`minmax(0,${x}fr)`); });
    box.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : t.join(' ');
    box.style.gridTemplateRows = narrow ? t.join(' ') : 'minmax(0,1fr)';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, narrow, ui.rat]);
  const dragGutter = (i) => (e) => {
    const n = cols.length, box = boxRef.current, st = { p: narrow ? e.clientY : e.clientX, r: ratios(n) };
    const size = (narrow ? box.clientHeight : box.clientWidth) - (n - 1) * 9.6 - 19.2;
    e.currentTarget.classList.add('drag');
    const el = e.currentTarget;
    const mv = (ev) => {
      const sum = st.r.reduce((x, y) => x + y, 0), d = (((narrow ? ev.clientY : ev.clientX) - st.p) / Math.max(1, size)) * sum;
      let a = st.r[i] + d, b = st.r[i + 1] - d;
      if (a < 0.25) { b -= 0.25 - a; a = 0.25; } if (b < 0.25) { a -= 0.25 - b; b = 0.25; }
      const r = st.r.slice(); r[i] = a; r[i + 1] = b; setUI({ rat: { ...getUI().rat, [sig]: r } });
    };
    const end = () => { el.classList.remove('drag'); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', end); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', end);
  };
  // Rearrange. Whole columns move left/right; a pane can be tucked under the column to its left
  // (or popped back out into its own column), so a column frees up for another tab.
  const cloneCols = () => colsDesk.map((c) => c.slice());
  const moveCol = (p, to) => {
    const cs = cloneCols(), from = cs.findIndex((c) => c.includes(p));
    if (from < 0 || to < 0 || to >= cs.length || to === from) return;
    const [c] = cs.splice(from, 1); cs.splice(to, 0, c); setCols(cs);
  };
  const tuckUnder = (p, target) => {
    let cs = cloneCols();
    const from = cs.findIndex((c) => c.includes(p));
    let ti = target ? cs.findIndex((c) => c.includes(target)) : from - 1;
    if (from < 0 || ti < 0 || cs[from].length > 1 && !target) return;
    cs[from] = cs[from].filter((x) => x !== p);
    const tcol = cs[ti]; const at = target ? tcol.indexOf(target) + 1 : tcol.length;
    tcol.splice(at, 0, p);
    cs = cs.filter((c) => c.length); setCols(cs);
  };
  const popOut = (p) => {
    const cs = cloneCols(), from = cs.findIndex((c) => c.includes(p));
    if (from < 0 || cs[from].length < 2 || cs.length >= MAXCOL) return;
    cs[from] = cs[from].filter((x) => x !== p); cs.splice(from + 1, 0, [p]); setCols(cs);
  };
  const reorderInCol = (p, d) => {
    const cs = cloneCols(), c = cs.find((x) => x.includes(p)), i = c.indexOf(p), j = i + d;
    if (j < 0 || j >= c.length) return;
    [c[i], c[j]] = [c[j], c[i]]; setCols(cs);
  };
  const startMove = (p) => (e) => {
    if (e.target.closest('button')) return;
    const box = boxRef.current; if (!box) return;
    e.preventDefault();
    const wrap = e.currentTarget.closest('.pwrap'); wrap.classList.add('moving');
    const mv = (ev) => {
      const cws = [...box.querySelectorAll(':scope > .pcol')]; if (!cws.length) return;
      if (!narrow) {
        // drop onto the lower part of another pane = tuck beneath it
        const hit = document.elementsFromPoint(ev.clientX, ev.clientY).map((x) => x.closest && x.closest('.pwrap')).find((x) => x && x.dataset.pane !== p);
        if (hit) {
          const r = hit.getBoundingClientRect();
          if (ev.clientY > r.top + r.height * 0.6) { tuckUnder(p, hit.dataset.pane); return; }
        }
      }
      if (cws.length < 2 && narrow) return;
      const pos = narrow ? ev.clientY : ev.clientX;
      let best = 0, bd = Infinity;
      cws.forEach((el, i) => { const r = el.getBoundingClientRect(), c = narrow ? r.top + r.height / 2 : r.left + r.width / 2; const d = Math.abs(pos - c); if (d < bd) { bd = d; best = i; } });
      const myCol = colsDesk.findIndex((c) => c.includes(p));
      if (narrow) moveCol(p, best);
      else if (colsDesk[myCol].length > 1) { if (best !== myCol) popOutTo(p, best); }
      else moveCol(p, best);
    };
    const end = () => { wrap.classList.remove('moving'); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  };
  // a tucked pane dragged sideways leaves its column and takes a column slot at that position
  const popOutTo = (p, idx) => {
    const cs = cloneCols(), from = cs.findIndex((c) => c.includes(p));
    if (cs.length >= MAXCOL) return;
    cs[from] = cs[from].filter((x) => x !== p); cs.splice(idx > from ? idx + 0 : idx, 0, [p]); setCols(cs.filter((c) => c.length));
  };
  const resetGutter = () => { const r = { ...getUI().rat }; delete r[sig]; setUI({ rat: r }); };

  const lastG = lastGame(S);
  const editLast = () => { if (lastG) setEdit(lastG.id); else toast('No game yet this session'); };

  const render = (p) => {
    if (p === 'log') return <LogPane onEditLast={editLast} onFocusToggle={toggleFocus} />;
    const body = {
      dash: <DashPane />, hist: <HistPane onOpen={setEdit} />, goals: <GoalsPane onEdit={setGoal} />,
      combos: <CombosPane />, review: <ReviewPane onStudy={study} />,
      opts: <OptionsPane onTags={() => setTags(true)} onCsv={() => setCsv(toCsv(S))} />,
    }[p];
    return <section className="pane" id={`p-${p}`}><div className="fill">{body}</div></section>;
  };

  return (
    <div className="lab" style={ui.scale !== 100 ? { zoom: ui.scale / 100 } : undefined}>
      <div id="app">
        <header id="top">
          <ProfileCard S={S} me={me} onPick={() => setPick(true)} />
          <AccountSwitcher />
          <div className="seg3" role="group" aria-label="Input device">
            {DEVICES.map((d) => (
              <button key={d} type="button" aria-pressed={d === dev} aria-label={d === 'Stick' ? 'Fight stick' : d === 'Hitbox' ? 'Leverless hitbox' : 'Gamepad'} onClick={() => setDevice(d)}><Icon name={d} /><span>{d}</span></button>
            ))}
          </div>
          <button type="button" className={`sync ${sync.email ? (sync.status === 'error' ? 'warn' : 'ok') : 'warn'}`} style={{ background: 'none', border: 0 }} onClick={() => setSyncOpen(true)} aria-label="Sync settings">
            <i /><span>{sync.email ? (sync.status === 'syncing' ? 'Syncing…' : sync.status === 'error' ? 'Sync problem' : 'Synced') : 'This device only · tap to sync'}</span>
          </button>
          <nav id="tabs" aria-label="Panes (tap several to split the screen)">
            {PANES.map((p) => <button key={p} type="button" aria-pressed={sel.includes(p)} onClick={() => toggle(p)}><Icon name={p} /><span>{PLBL[p]}</span></button>)}
          </nav>
        </header>
        <main id="panes" ref={boxRef}>
          {cols.map((col, ci) => (
            <FragmentWith key={col[0]} gutter={ci > 0 ? <div className="gutter" role="separator" aria-label="Drag to resize panes" title="Drag to resize · double-click to reset" onPointerDown={dragGutter(ci - 1)} onDoubleClick={resetGutter} /> : null}>
              <div className="pcol">
                {col.map((p, ri) => (
                  <div className="pwrap" data-pane={p} key={p}>
                    {vis.length > 1 && (
                      <div className="ptool" onPointerDown={startMove(p)} title="Drag to rearrange · drop on the lower half of another pane to tuck underneath">
                        <span className="grip" aria-hidden="true">⠿</span><b>{PLBL[p]}</b>
                        <span className="psp" />
                        {!narrow && col.length > 1 && <button type="button" aria-label={`Move ${PLBL[p]} up in column`} disabled={ri === 0} onClick={() => reorderInCol(p, -1)}>▲</button>}
                        {!narrow && col.length > 1 && <button type="button" aria-label={`Move ${PLBL[p]} down in column`} disabled={ri === col.length - 1} onClick={() => reorderInCol(p, 1)}>▼</button>}
                        {!narrow && col.length === 1 && ci > 0 && <button type="button" title="Tuck under the column to the left" aria-label={`Tuck ${PLBL[p]} under the column on the left`} onClick={() => tuckUnder(p)}>⤓</button>}
                        {!narrow && col.length > 1 && <button type="button" title="Pop out into its own column" aria-label={`Pop ${PLBL[p]} out into its own column`} disabled={cols.length >= MAXCOL} onClick={() => popOut(p)}>⤢</button>}
                        {(narrow || col.length === 1) && <button type="button" aria-label={`Move ${PLBL[p]} ${narrow ? 'up' : 'left'}`} disabled={ci === 0} onClick={() => moveCol(p, ci - 1)}>{narrow ? '▲' : '◀'}</button>}
                        {(narrow || col.length === 1) && <button type="button" aria-label={`Move ${PLBL[p]} ${narrow ? 'down' : 'right'}`} disabled={ci === cols.length - 1} onClick={() => moveCol(p, ci + 1)}>{narrow ? '▼' : '▶'}</button>}
                        <button type="button" aria-label={`Close ${PLBL[p]}`} onClick={() => toggle(p)}>✕</button>
                      </div>
                    )}
                    {render(p)}
                  </div>
                ))}
              </div>
            </FragmentWith>
          ))}
        </main>
      </div>

      {syncOpen && <SyncModal onClose={() => setSyncOpen(false)} />}
      {pick && (
        <Overlay onClose={() => setPick(false)}>
          <h2>Playing as</h2>
          <div className="pick">{ROSTER.map((c) => <Tile key={c} c={c} pressed={c === me} onClick={() => { setMe(c); setPick(false); }} />)}</div>
          <p><button type="button" className="btn" onClick={() => setPick(false)}>Close</button></p>
        </Overlay>
      )}
      {edit && <EditGameModal id={edit} onClose={() => setEdit(null)} onStudy={(c) => { setEdit(null); study(c); }} />}
      {goal && <GoalModal id={goal} onClose={() => setGoal(null)} />}
      {tags && <TagManager onClose={() => setTags(false)} />}
      {csv != null && <CsvModal text={csv} onClose={() => setCsv(null)} />}
      <LockModal S={S} />
      <Toast />
    </div>
  );
}

// renders an optional gutter before its pane (panes are grid children, so no wrapper element)
function FragmentWith({ gutter, children }) { return <>{gutter}{children}</>; }

