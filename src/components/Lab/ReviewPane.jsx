// Replay Review: log a moment from a replay, what to lab, the answer, the drill.
import { useRef, useState } from 'react';
import { useLab } from '../../lab/store';
import { meNow, byId, strip } from '../../lab/calc';
import { ROSTER, RV_CATS } from '../../lab/data';
import { put, del } from '../../lab/store';
import { toast } from './toastBus';

const blank = (me) => ({ opp: '', oc: '', mc: me, mid: '', game: '', round: '', time: '', cat: RV_CATS[0], what: '', lab: '', sol: '', drill: '', cue: '' });
const cardText = (r) => [
  `${r.mc || ''} vs ${r.oc || '?'}${r.opp ? ` (${r.opp})` : ''}${r.mid ? ` · ID ${r.mid}` : ''}`,
  `G${r.game || '?'} R${r.round || '?'}${r.time ? ` · ${r.time} left` : ''} · ${r.cat || ''}`,
  `Situation: ${r.what || '–'}`, `Lab: ${r.lab || '–'}`, `Answer: ${r.sol || '–'}`, `Drill: ${r.drill || '–'}`, `Cue: ${r.cue || '–'}`,
].join('\n');

export default function ReviewPane({ onStudy }) {
  const S = useLab(), me = meNow(S), top = useRef(null);
  const [f, setF] = useState(() => blank(me));
  const [id, setId] = useState(null), [arm, setArm] = useState(null);
  const [fl, setFl] = useState({ c: '', k: '', d: 'open' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = () => {
    const o = { ...f };
    ['opp', 'mid', 'time', 'what', 'lab', 'sol', 'drill', 'cue'].forEach((k) => { o[k] = o[k].trim(); });
    if (!o.what && !o.lab && !o.sol && !o.drill) { toast('Fill in what happened (or a lab/solution/drill) first'); return; }
    const old = id ? byId(S.reviews, id) : null;
    put('reviews', id || 'r' + Date.now().toString(36), { ...o, done: old ? !!old.done : false, created: (old && old.created) || Date.now(), upd: Date.now() });
    toast('Review saved'); setF(blank(me)); setId(null);
  };
  const load = (r) => { setId(r.id); setF({ ...blank(me), ...strip(r), mc: r.mc || me, cat: r.cat || RV_CATS[0] }); top.current && top.current.scrollIntoView && top.current.scrollIntoView({ block: 'center' }); };
  const del2 = (r) => {
    if (arm === r.id) { setArm(null); if (id === r.id) { setF(blank(me)); setId(null); } del('reviews', r.id); return; }
    setArm(r.id); setTimeout(() => setArm((a) => (a === r.id ? null : a)), 3000);
  };
  const copy = (r) => { try { navigator.clipboard.writeText(cardText(r)).then(() => toast('Card copied'), () => toast('Copy blocked by the browser')); } catch { toast('Copy not available here'); } };

  const list = S.reviews.filter((r) => {
    if (fl.c && r.oc !== fl.c) return false; if (fl.k && r.cat !== fl.k) return false;
    if (fl.d === 'open' && (r.done || !r.drill)) return false; if (fl.d === 'done' && !r.done) return false; return true;
  }).sort((x, y) => (y.upd || 0) - (x.upd || 0));
  const open = S.reviews.filter((r) => r.drill && !r.done).length;
  const opts = (a, blankLbl) => <>{blankLbl != null && <option value="">{blankLbl}</option>}{a.map((c) => <option key={c}>{c}</option>)}</>;
  const P = ({ l, t }) => (t ? <p><span>{l}</span>{t}</p> : null);

  return (
    <div className="rv" ref={top}>
      <div className="rvg">
        <label>Opponent<input type="text" autoComplete="off" placeholder="Name / tag" value={f.opp} onChange={set('opp')} /></label>
        <label>Their character<select value={f.oc} onChange={set('oc')}>{opts(ROSTER, 'Pick…')}</select></label>
        <label>My character<select value={f.mc} onChange={set('mc')}>{opts(ROSTER)}</select></label>
        <label>Match / replay ID (optional)<input type="text" autoComplete="off" placeholder="e.g. 1234567" value={f.mid} onChange={set('mid')} /></label>
        <label>Game<select value={f.game} onChange={set('game')}><option value="">–</option>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label>Round<select value={f.round} onChange={set('round')}><option value="">–</option><option>1</option><option>2</option><option>3</option><option>Final</option></select></label>
        <label>Time left (clock)<input type="text" inputMode="numeric" autoComplete="off" placeholder="e.g. 62" value={f.time} onChange={set('time')} /></label>
        <label>Category<select value={f.cat} onChange={set('cat')}>{opts(RV_CATS)}</select></label>
      </div>
      <label>What happened<textarea placeholder="Situation, what they did, what I did, the result" value={f.what} onChange={set('what')} /></label>
      <label>What to lab<textarea placeholder="Training-mode setup / situation to recreate" value={f.lab} onChange={set('lab')} /></label>
      <label>Solution<textarea placeholder="The answer: button, option, frame truth" value={f.sol} onChange={set('sol')} /></label>
      <div className="rvg">
        <label>Drill<input type="text" autoComplete="off" placeholder="Drill to run (e.g. 10 reps vs reversal)" value={f.drill} onChange={set('drill')} /></label>
        <label>Cue word<input type="text" autoComplete="off" placeholder="One word" value={f.cue} onChange={set('cue')} /></label>
      </div>
      <div className="cbacts">
        <button type="button" className="btn primary" onClick={save}>{id ? 'Update review' : 'Save review'}</button>
        <button type="button" className="btn" onClick={() => { setF(blank(me)); setId(null); }}>Clear</button>
      </div>
      <h3 style={{ margin: '.3rem 0 0' }}>Reviews <span className="mute" style={{ fontSize: '.8rem', fontWeight: 400 }}>· {open} drill{open === 1 ? '' : 's'} to do</span></h3>
      <div className="rvg">
        <select aria-label="Filter character" value={fl.c} onChange={(e) => setFl({ ...fl, c: e.target.value })}>{opts(ROSTER, 'All characters')}</select>
        <select aria-label="Filter category" value={fl.k} onChange={(e) => setFl({ ...fl, k: e.target.value })}>{opts(RV_CATS, 'All categories')}</select>
        <select aria-label="Filter drills" value={fl.d} onChange={(e) => setFl({ ...fl, d: e.target.value })}><option value="open">Drills to do</option><option value="all">All</option><option value="done">Drills done</option></select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
        {!list.length && <p className="mute">Nothing here yet. Log a moment from a replay above.</p>}
        {list.map((r) => (
          <div key={r.id} className={`rvrow${r.done ? ' done' : ''}`}>
            <div className="rvh"><b>{r.oc || '?'}</b><span className="rvq">{r.opp || ''}{r.mid ? ` · ID ${r.mid}` : ''}</span>
              <span className="rvq">G{r.game || '?'} R{r.round || '?'}{r.time ? ` · ${r.time} left` : ''}</span><span className="rvtag">{r.cat || ''}</span></div>
            <P l="Happened" t={r.what} /><P l="Lab" t={r.lab} /><P l="Answer" t={r.sol} /><P l="Drill" t={r.drill ? r.drill + (r.cue ? `  ·  cue: ${r.cue}` : '') : ''} />
            <div className="rvh" style={{ marginTop: '.2rem' }}>
              <button type="button" className="mini" style={{ minHeight: '2.6rem', minWidth: '5.5rem' }} onClick={() => put('reviews', r.id, { ...strip(r), done: !r.done })}>{r.done ? 'Re-open' : 'Drill done'}</button>
              {r.oc && <button type="button" className="mini" style={{ minHeight: '2.6rem', minWidth: '4.4rem' }} onClick={() => onStudy(r.oc)}>Study</button>}
              <button type="button" className="mini" style={{ minHeight: '2.6rem', minWidth: '4.4rem' }} onClick={() => copy(r)}>Copy</button>
              <button type="button" className="mini" style={{ minHeight: '2.6rem', minWidth: '3.6rem' }} onClick={() => load(r)}>Edit</button>
              <button type="button" className={`mini${arm === r.id ? ' danger' : ''}`} style={{ minHeight: '2.6rem', minWidth: '4.2rem' }} onClick={() => del2(r)}>{arm === r.id ? 'Sure?' : 'Delete'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
