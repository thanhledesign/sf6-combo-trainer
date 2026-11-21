// V01.33 Session Lab — native page. Header (character, device, panes) + up to three
// resizable panes: Log, Live, History, Goals, Combos, Review, Options.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { availableCharacterIds } from '../../data/characters/loader';
import { useLab, useUI, getUI, setUI } from '../../lab/store';
import { meNow, devNow, toCsv, lastGame, opts } from '../../lab/calc';
import { ROSTER, DEVICES, nameToCharId, thumbOf } from '../../lab/data';
import { setDevice, setMe, syncGoals, lockState, lockSave, lockEnd, toggleFocus } from '../../lab/useLabActions';
import { toast } from './toastBus';
import { Icon, Overlay, Tile, Toast } from './ui';
import LogPane from './LogPane';
import { DashPane, HistPane, GoalsPane, EditGameModal, GoalModal } from './StatsPanes';
import { OptionsPane, TagManager, CsvModal } from './OptionsPane';
import ReviewPane from './ReviewPane';
import CombosPane from './CombosPane';
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
  const [edit, setEdit] = useState(null), [goal, setGoal] = useState(null), [tags, setTags] = useState(false), [csv, setCsv] = useState(null), [pick, setPick] = useState(false);
  const me = meNow(S), dev = devNow(S);
  const boxRef = useRef(null), [narrow, setNarrow] = useState(false);

  const study = useCallback((name) => {
    const id = nameToCharId(name, availableCharacterIds);
    navigate(id ? `/browse/${id}` : '/characters');
  }, [navigate]);

  // deep links: /tracker/review and /tracker/combos open that pane
  useEffect(() => {
    const cur0 = getUI().sel;
    if (pane === 'log') { if (!cur0 || !cur0.length) setUI({ sel: window.innerWidth >= 1100 ? ['log', 'dash'] : ['log'] }); else if (!cur0.includes('log')) setUI({ sel: ['log', ...cur0].slice(0, 3) }); }
    else if (!cur0 || !cur0.includes(pane)) setUI({ sel: [pane] });
  }, [pane]);
  useEffect(() => { try { syncGoals(); } catch { /* ignore */ } }, [S.games, S.goals]);
  useEffect(() => {
    const f = () => setTags(true); window.addEventListener('lab:tags', f); return () => window.removeEventListener('lab:tags', f);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia ? window.matchMedia('(max-width:760px)') : null; if (!mq) return undefined;
    const f = () => setNarrow(mq.matches); f(); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f);
  }, []);

  const sel = (ui.sel && ui.sel.length ? ui.sel : ['log']).filter((p) => PANES.includes(p));
  const vis = PANES.filter((p) => sel.includes(p)), sig = vis.join(',');
  const toggle = (p) => {
    const a = sel.slice(), i = a.indexOf(p);
    if (i >= 0) { if (a.length > 1) a.splice(i, 1); } else { a.push(p); if (a.length > 3) a.shift(); }
    setUI({ sel: a });
  };

  // ratios between panes
  const ratios = (n) => { const r = ((ui.rat || {})[sig] || []).slice(0, n); for (let i = 0; i < n; i++) if (!(r[i] > 0)) r[i] = 1; return r; };
  useLayoutEffect(() => {
    const box = boxRef.current; if (!box) return;
    const n = vis.length;
    if (n < 2) { box.style.gridTemplateColumns = ''; box.style.gridTemplateRows = ''; return; }
    const r = ratios(n), t = []; r.forEach((x, i) => { if (i) t.push('.6rem'); t.push(`minmax(0,${x}fr)`); });
    box.style.gridTemplateColumns = narrow ? 'minmax(0,1fr)' : t.join(' ');
    box.style.gridTemplateRows = narrow ? t.join(' ') : 'minmax(0,1fr)';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, narrow, ui.rat]);
  const dragGutter = (i) => (e) => {
    const n = vis.length, box = boxRef.current, st = { p: narrow ? e.clientY : e.clientX, r: ratios(n) };
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

  const meImg = thumbOf(me);
  return (
    <div className="lab" style={ui.scale !== 100 ? { zoom: ui.scale / 100 } : undefined}>
      <div id="app">
        <header id="top">
          <button type="button" className="me" aria-label="Change character" onClick={() => setPick(true)}>
            <span className="meimg" hidden={!meImg} style={meImg ? { backgroundImage: `url('${meImg}')` } : undefined} />
            <div><small>PLAYING AS</small><b>{me}</b></div><span className="c">▾</span>
          </button>
          <div className="seg3" role="group" aria-label="Input device">
            {DEVICES.map((d) => (
              <button key={d} type="button" aria-pressed={d === dev} aria-label={d === 'Stick' ? 'Fight stick' : d === 'Hitbox' ? 'Leverless hitbox' : 'Gamepad'} onClick={() => setDevice(d)}><Icon name={d} /><span>{d}</span></button>
            ))}
          </div>
          <div className="sync ok" role="status"><i /><span>Saved on this device</span></div>
          <nav id="tabs" aria-label="Panes (tap several to split the screen)">
            {PANES.map((p) => <button key={p} type="button" aria-pressed={sel.includes(p)} onClick={() => toggle(p)}><Icon name={p} /><span>{PLBL[p]}</span></button>)}
          </nav>
        </header>
        <main id="panes" ref={boxRef}>
          {vis.map((p, i) => (
            <FragmentWith key={p} gutter={i > 0 ? <div className="gutter" role="separator" aria-label="Drag to resize panes" title="Drag to resize · double-click to reset" onPointerDown={dragGutter(i - 1)} onDoubleClick={resetGutter} /> : null}>
              {render(p)}
            </FragmentWith>
          ))}
        </main>
      </div>

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

