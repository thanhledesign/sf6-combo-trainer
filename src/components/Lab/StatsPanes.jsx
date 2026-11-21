// Live dashboard, history (with edit modal), goals (with goal modal).
import { useEffect, useState } from 'react';
import { useLab } from '../../lab/store';
import {
  cur, sg, sgm, wl, pct, lossRun, streakStr, winRun, stopOf, modeNow, modeName, meNow, opts, tagList, tagInfo, estMR, allGames, gap, recStr,
  runs, bestEver, evalGoal, goalTitle, suggestions, milestones, fmtT, fmtD, modeOf, num, byId, strip,
} from '../../lab/calc';
import { MODES, DEVICES, OPP, ROSTER, KINDS } from '../../lab/data';
import { put, del } from '../../lab/store';
import { addSuggestion } from '../../lab/useLabActions';
import { toast } from './toastBus';
import { Overlay, Table, TagChips } from './ui';

/* ---------------- live dashboard ---------------- */
function Tile({ cls = '', label, big, sub }) {
  return <div className={`tile ${cls}`}><span>{label}</span><b>{big}</b><span>{sub || ''}</span></div>;
}
function GoalTile({ S }) {
  const g = S.goals.find((x) => !evalGoal(S, x).done);
  if (!g) return <Tile cls="s2" label="Goal" big="–" sub="Add one on the Goals tab" />;
  const e = evalGoal(S, g);
  return (
    <div className="tile s2"><span>Goal</span><div className="rule">{goalTitle(g)}</div>
      <div><div className="bar"><i style={{ width: `${Math.round(e.pct * 100)}%` }} /></div><span>{e.cur} / {e.T}</span></div></div>
  );
}
function useNow() {
  const [t, setT] = useState(0);
  useEffect(() => { const tick = () => setT(Date.now()); tick(); const i = setInterval(tick, 30000); return () => clearInterval(i); }, []);
  return t;
}
export function DashPane() {
  const S = useLab(), s = cur(S), o = opts(S), d = o.dash, now = useNow();
  if (!s) return <div className="dash"><div className="tile s2"><span>No active session</span><div className="rule">Start one on the Log tab</div></div>{d.goal && <GoalTile S={S} />}</div>;
  const mode = modeNow(S), ranked = mode === 'ranked', all = sg(S, s), a = sgm(S, s), r = wl(a), run = lossRun(a), N = stopOf(s), me = meNow(S), e = estMR(S, me);
  const first = a.find((g) => (g.me || 'Ken') === me && g.myMR != null);
  const dm = e != null && first ? e - first.myMR : null;
  const nw = wl(a.filter((g) => !g.rm)), rm = wl(a.filter((g) => g.rm));
  let sb = 0; runs(S).forEach((x) => { if (x.sid === s.id && x.len > sb) sb = x.len; });
  const mins = now ? Math.max(0, Math.round((now - s.start) / 60000)) : 0;
  return (
    <div className="dash">
      {d.record && <Tile label={`Record · ${modeName(mode)}`} big={`${r.w}–${r.l}`} />}
      {d.win && <Tile label="Win rate" big={pct(r.w, r.n)} />}
      {d.streak && <Tile label="Streak" big={streakStr(a)} sub={`best this session ${sb} · ever ${bestEver(S)}`} />}
      {d.mr && ranked && <Tile label={`MR now · ${me}`} big={e != null ? e : '–'} sub={dm != null ? `${dm > 0 ? '+' : ''}${dm} this session` : ''} />}
      {d.lights && ranked && (
        <div className="tile"><span>Stop at {N > 0 ? `${N} losses` : 'never'}</span>
          <div className="lights">{N > 0 ? Array.from({ length: Math.min(N, 10) }, (_, j) => <i key={j} className={j < run ? 'on' : ''} style={{ width: '1.6rem', height: '1.6rem' }} />) : <span className="mute">no limit</span>}</div><span /></div>
      )}
      {d.games && <Tile label="Games" big={a.length} />}
      {d.minutes && <Tile label="Minutes" big={mins} />}
      {d.rule && (
        <div className="tile s2"><span>Rule</span><div className="rule">{s.rule || 'No rule set'}</div>
          <div className="cues">{(s.cues || []).filter(Boolean).map((c, i) => <em key={i}>{c}</em>)}</div></div>
      )}
      {d.dots && (
        <div className="tile s2"><span>Last {o.dotsN}</span>
          <div className="dots">{a.slice(-o.dotsN).map((g, i) => <i key={i} className={g.r} title={g.r} />)}</div><span /></div>
      )}
      {d.rematch && <Tile cls="s2" label="New opponent vs rematch" big={`${nw.w}–${nw.l} vs ${rm.w}–${rm.l}`} />}
      <div className="tile s2"><span>By mode this session</span>
        <div className="rule" style={{ fontSize: '1.25rem' }}>{MODES.map((m) => { const q = wl(all.filter((g) => modeOf(g) === m[0])); return `${m[1]} ${q.w}–${q.l}`; }).join(' · ')}</div><span /></div>
      {d.goal && <GoalTile S={S} />}
    </div>
  );
}

/* ---------------- history ---------------- */
export function GameRow({ g, S, onOpen }) {
  const gp = gap(g);
  return (
    <button type="button" className={`game ${g.r}`} onClick={() => onOpen(g.id)}>
      <span className="r">{g.r}</span>
      <span><b>{g.char || 'Unknown'}</b>{g.opp ? <> <span className="mute">{g.opp}</span></> : null}{g.rm ? <> <span className="warn">rematch</span></> : null}
        <small>{fmtT(g.t)} · {modeName(modeOf(g))} · {g.me || 'Ken'} · {g.dev || ''}{g.tags && g.tags.length ? ` · ${g.tags.map((k) => tagInfo(S, k)[1]).join(', ')}` : ''}{g.note ? ` · ${g.note}` : ''}</small></span>
      <span className="mono">{g.myMR != null ? g.myMR : '?'} vs {g.oppMR != null ? g.oppMR : '?'}{gp != null ? <small>{gp > 0 ? '+' : ''}{gp}</small> : null}</span>
    </button>
  );
}
export function HistPane({ onOpen }) {
  const S = useLab();
  const [me, setMe] = useState('all'), [mode, setMode] = useState('all');
  const all0 = allGames(S), mes = {}; all0.forEach((g) => { mes[g.me || 'Ken'] = 1; });
  const a = all0.filter((g) => (me === 'all' || (g.me || 'Ken') === me) && (mode === 'all' || modeOf(g) === mode));
  const chips = (
    <>
      <div className="chips" style={{ maxHeight: 'none', marginBottom: '.6rem' }}>
        <button type="button" className="chip" aria-pressed={me === 'all'} onClick={() => setMe('all')}>All</button>
        {Object.keys(mes).sort().map((c) => <button key={c} type="button" className="chip" aria-pressed={me === c} onClick={() => setMe(c)}>{c}</button>)}
      </div>
      <div className="chips" style={{ maxHeight: 'none', marginBottom: '.6rem' }}>
        <button type="button" className="chip" aria-pressed={mode === 'all'} onClick={() => setMode('all')}>All modes</button>
        {MODES.map((m) => <button key={m[0]} type="button" className="chip" aria-pressed={mode === m[0]} onClick={() => setMode(m[0])}>{m[1]}</button>)}
      </div>
    </>
  );
  if (!a.length) return <div>{chips}<div className="card"><h2>No games yet</h2></div></div>;
  const t = wl(a), nw = wl(a.filter((g) => !g.rm)), rm = wl(a.filter((g) => g.rm)), aw = [], al = [];
  for (let i = 0; i < a.length - 1; i++) { if (a[i].sid !== a[i + 1].sid) continue; (a[i].r === 'W' ? aw : al).push(a[i + 1]); }
  const hi = wl(a.filter((g) => g.myMR != null && g.myMR >= 1500));
  const dv = DEVICES.map((d) => { const s = a.filter((g) => (g.dev || 'Stick') === d), r = wl(s); return [d, r.n, `${r.w}–${r.l}`, pct(r.w, r.n)]; }).filter((r) => r[1] > 0);
  const bins = [['Opp 30+ above', (x) => x >= 30], ['Opp 11–29 above', (x) => x > 10 && x < 30], ['Within ±10', (x) => Math.abs(x) <= 10], ['Opp 11–29 below', (x) => x < -10 && x > -30], ['Opp 30+ below', (x) => x <= -30]];
  const byC = {}; a.forEach((g) => { if (g.char) (byC[g.char] = byC[g.char] || []).push(g); });
  const rows = Object.keys(byC).map((c) => { const r = wl(byC[c]); return [c, r.n, `${r.w}–${r.l}`, pct(r.w, r.n)]; }).sort((x, y) => y[1] - x[1]);
  const tr = tagList(S).map((tg) => {
    const w = a.filter((g) => (g.tags || []).includes(tg[0])), o = a.filter((g) => !(g.tags || []).includes(tg[0])), rw = wl(w), ro = wl(o);
    return [<>{tg[1]} <span className="mute">({tg[2] === 'leak' ? 'leak' : 'strength'})</span></>, rw.n, pct(rw.w, rw.n), pct(ro.w, ro.n)];
  }).filter((r) => r[1] > 0);
  return (
    <div>
      {chips}
      <h2>{t.w}–{t.l} <span className="mute">({pct(t.w, t.n)}, {t.n} games)</span></h2>
      <h3>Patterns</h3>
      <Table head={['Split', 'Record', 'Win %']} rows={[
        ['New opponent', `${nw.w}–${nw.l}`, pct(nw.w, nw.n)], ['Rematch', `${rm.w}–${rm.l}`, pct(rm.w, rm.n)],
        ['After a win', recStr(aw), pct(wl(aw).w, aw.length)], ['After a loss', recStr(al), pct(wl(al).w, al.length)],
        ['Pre-match MR 1500+', `${hi.w}–${hi.l}`, pct(hi.w, hi.n)]]} />
      {dv.length > 0 && <><h3>By device</h3><Table head={['Device', 'Games', 'Record', 'Win %']} rows={dv} /></>}
      <h3>By MR gap</h3>
      <Table head={['Gap', 'Record', 'Win %']} rows={bins.map((b) => { const r = wl(a.filter((g) => { const d = gap(g); return d != null && b[1](d); })); return [b[0], `${r.w}–${r.l}`, pct(r.w, r.n)]; })} />
      {rows.length > 0 && <><h3>By character</h3><Table head={['Character', 'Games', 'Record', 'Win %']} rows={rows} /></>}
      {tr.length > 0 && <><h3>Tags</h3><Table head={['Tag', 'Games', 'Win % with', 'Win % without']} rows={tr} /></>}
      <h3>Games</h3>
      {a.slice().reverse().slice(0, 40).map((g) => <GameRow key={g.id} g={g} S={S} onOpen={onOpen} />)}
    </div>
  );
}

/* ---------------- edit game ---------------- */
const nv = (v) => (v === '' || v == null ? '' : v);
export function EditGameModal({ id, onClose, onStudy }) {
  const S = useLab(), g = byId(S.games, id);
  const [f, setF] = useState(() => g ? ({
    r: g.r, char: g.char || '', oppMR: nv(g.oppMR), myMR: nv(g.myMR), myAfter: nv(g.myAfter), oppAfter: nv(g.oppAfter), opp: g.opp || '', rm: !!g.rm,
    note: g.note || '', me: g.me || 'Ken', dev: g.dev || 'Stick', mode: modeOf(g), tags: Object.fromEntries((g.tags || []).map((t) => [t, true])),
  }) : null);
  if (!g || !f) return null;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = () => {
    put('games', id, { ...strip(g), r: f.r, char: f.char || null, oppMR: num(f.oppMR), myMR: num(f.myMR), myAfter: num(f.myAfter), oppAfter: num(f.oppAfter), opp: f.opp.trim(), rm: f.rm, me: f.me, dev: f.dev, mode: f.mode, tags: Object.keys(f.tags).filter((k) => f.tags[k]), note: f.note.trim() });
    onClose();
  };
  return (
    <Overlay onClose={onClose} wide>
      <h2>Edit game</h2>
      <div className="row2">
        <label>Result<select value={f.r} onChange={set('r')}><option value="W">Won</option><option value="L">Lost</option></select></label>
        <label>Opponent character<select value={f.char} onChange={set('char')}><option value="">Unknown</option>{OPP.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Opponent MR<input type="number" inputMode="numeric" value={f.oppMR} onChange={set('oppMR')} /></label>
        <label>My MR<input type="number" inputMode="numeric" value={f.myMR} onChange={set('myMR')} /></label>
        <label>My MR after (result screen)<input type="number" inputMode="numeric" value={f.myAfter} onChange={set('myAfter')} /></label>
        <label>Opponent MR after<input type="number" inputMode="numeric" value={f.oppAfter} onChange={set('oppAfter')} /></label>
        <label>Opponent name<input type="text" value={f.opp} onChange={set('opp')} /></label>
        <label>My character<select value={f.me} onChange={set('me')}>{ROSTER.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Device<select value={f.dev} onChange={set('dev')}>{DEVICES.map((d) => <option key={d}>{d}</option>)}</select></label>
        <label>Mode<select value={f.mode} onChange={set('mode')}>{MODES.map((m) => <option key={m[0]} value={m[0]}>{m[1]}</option>)}</select></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', color: 'var(--text)' }}><input type="checkbox" checked={f.rm} onChange={set('rm')} style={{ width: '1.4rem', height: '1.4rem' }} /> Rematch</label>
      </div>
      <div className="label" style={{ marginTop: '.6rem', fontSize: '.8rem', color: 'var(--mute)' }}>Tags</div>
      <div className="chips" style={{ maxHeight: 'none' }}><TagChips tags={tagList(S)} sel={f.tags} onToggle={(k) => setF({ ...f, tags: { ...f.tags, [k]: !f.tags[k] } })} /></div>
      <label style={{ marginTop: '.6rem' }}>Note<textarea style={{ minHeight: '4rem' }} value={f.note} onChange={set('note')} /></label>
      <div className="row2" style={{ marginTop: '.6rem' }}>
        <button type="button" className="btn primary" onClick={save}>Save</button>
        <button type="button" className="btn" onClick={onClose}>Cancel</button>
        {f.char && f.char !== 'Random' && <button type="button" className="btn" onClick={() => onStudy(f.char)}>Study {f.char} →</button>}
      </div>
      <p><button type="button" className="btn danger" onClick={() => { del('games', id); onClose(); }}>Delete game</button></p>
    </Overlay>
  );
}

/* ---------------- goals ---------------- */
function GoalCard({ g, e, onEdit }) {
  return (
    <div className={`card goal${e.done ? ' done' : ''}`}>
      <div className="gt"><b>{e.done ? '✓ ' : ''}{goalTitle(g)}</b><span className="mono">{e.done && e.at ? fmtD(e.at) : `${e.cur} / ${e.T}`}</span></div>
      <div className="bar"><i style={{ width: `${Math.round(e.pct * 100)}%` }} /></div>
      <div className="gb">
        {g.kind === 'custom' && <>
          <button type="button" className="btn" onClick={() => put('goals', g.id, { ...strip(g), manual: Math.max(0, (g.manual || 0) + 1), doneAt: null })}>+1</button>
          <button type="button" className="btn" onClick={() => put('goals', g.id, { ...strip(g), manual: Math.max(0, (g.manual || 0) - 1), doneAt: null })}>−1</button></>}
        <button type="button" className="btn" onClick={() => onEdit(g.id)}>Edit</button>
      </div>
    </div>
  );
}
export function GoalsPane({ onEdit }) {
  const S = useLab(), s = cur(S), a = s ? sg(S, s) : [];
  const [len, setLen] = useState(''), [note, setNote] = useState('');
  const rs = runs(S).filter((r) => r.len >= 3).sort((x, y) => y.start - x.start).slice(0, 6);
  const man = S.streaks.slice().sort((x, y) => y.t - x.t).slice(0, 6);
  const act = [], done = [];
  S.goals.forEach((g) => { const e = evalGoal(S, g); (e.done ? done : act).push({ g, e }); });
  const sug = suggestions(S, meNow(S)), ms = milestones(S, 'all');
  return (
    <div>
      <div className="row2"><div className="stat"><b>{winRun(a)}</b><span>Current win streak</span></div><div className="stat"><b>{bestEver(S)}</b><span>Best streak ever (auto + manual)</span></div></div>
      <h3>Streaks</h3>
      {rs.map((r) => <div key={r.start} className="card goal"><div className="gt"><b>{r.len} wins</b><span className="mute">{fmtD(r.start)} · auto</span></div><span className="mute">{r.games.map((g) => g.char || '?').join(', ')}</span></div>)}
      {man.map((x) => (
        <div key={x.id} className="card goal"><div className="gt"><b>{x.len} wins</b><span className="mute">{fmtD(x.t)} · added</span></div>
          <span className="mute">{x.note || ''}</span> <button type="button" className="btn" onClick={() => del('streaks', x.id)}>Remove</button></div>
      ))}
      {!rs.length && !man.length && <p className="mute">Streaks of 3+ wins in a session are found automatically.</p>}
      <div className="row2" style={{ alignItems: 'end' }}>
        <label>Add a streak<input type="number" inputMode="numeric" placeholder="Wins, e.g. 9" value={len} onChange={(e) => setLen(e.target.value)} /></label>
        <label>Note<input type="text" placeholder="optional" value={note} onChange={(e) => setNote(e.target.value)} /></label>
        <button type="button" className="btn primary" onClick={() => { const n = num(len); if (!n || n < 1) { toast('Enter the streak length'); return; } put('streaks', 'k' + Date.now(), { len: n, t: Date.now(), note: note.trim(), manual: true }); setLen(''); setNote(''); }}>Add streak</button>
      </div>
      <h3>Goals</h3>
      {act.map((x) => <GoalCard key={x.g.id} {...x} onEdit={onEdit} />)}
      {!act.length && <p className="mute">No active goals.</p>}
      <p><button type="button" className="btn primary" onClick={() => onEdit('new')}>+ New goal</button></p>
      {sug.length > 0 && <><div className="label" style={{ fontSize: '.8rem', color: 'var(--mute)' }}>Suggestions (tap to add)</div>
        <div className="sugg">{sug.map((x, i) => <button key={i} type="button" className="chip add" onClick={() => addSuggestion(x)}>+ {x.title}</button>)}</div></>}
      {done.length > 0 && <><h3>Completed</h3>{done.map((x) => <GoalCard key={x.g.id} {...x} onEdit={onEdit} />)}</>}
      <h3>Auto milestones</h3>
      {ms.length ? ms.map((m, i) => <div key={i} className="card goal"><div className="gt"><b>{m.l}</b><span className="mute">{fmtD(m.t)}</span></div><span className="mute">{m.d}</span></div>) : <p className="mute">Log games and milestones appear here.</p>}
    </div>
  );
}
export function GoalModal({ id, onClose }) {
  const S = useLab(), g = id === 'new' ? null : byId(S.goals, id), me = meNow(S);
  const [f, setF] = useState({
    kind: g ? g.kind : 'beat', target: g ? g.target : 1, min: g && g.minOpp ? g.minOpp : '', opp: g && g.oppChar ? g.oppChar : '',
    scope: g && g.me ? 'me' : 'any', existing: g ? g.created === 0 : false, title: g ? g.title || '' : '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = () => {
    const T = Math.max(1, num(f.target) || 1), title = f.title.trim();
    if (f.kind === 'custom' && !title) { toast('Name your custom goal'); return; }
    const who = f.scope === 'me' ? me : null;
    put('goals', g ? g.id : 'o' + Date.now(), {
      kind: f.kind, target: T, title, minOpp: f.kind === 'beat' ? num(f.min) || 0 : null, oppChar: f.opp || null, me: who,
      created: f.existing ? 0 : g && g.created ? g.created : Date.now(), base: f.kind === 'mr' ? (g && g.base != null ? g.base : estMR(S, who || me)) : null, manual: g ? g.manual || 0 : 0, doneAt: null,
    });
    onClose();
  };
  return (
    <Overlay onClose={onClose}>
      <h2>{g ? 'Edit goal' : 'New goal'}</h2>
      <div className="row2">
        <label>Type<select value={f.kind} onChange={set('kind')}>{Object.keys(KINDS).map((k) => <option key={k} value={k}>{KINDS[k]}</option>)}</select></label>
        <label>Target<input type="number" inputMode="numeric" min="1" value={f.target} onChange={set('target')} /></label>
        {f.kind === 'beat' && <label>Opponent MR at or above<input type="number" inputMode="numeric" placeholder="1800" value={f.min} onChange={set('min')} /></label>}
        {(f.kind === 'beat' || f.kind === 'wins') && <label>Opponent character<select value={f.opp} onChange={set('opp')}><option value="">Any</option>{OPP.map((c) => <option key={c}>{c}</option>)}</select></label>}
        <label>Applies to<select value={f.scope} onChange={set('scope')}><option value="any">Any character</option><option value="me">Current character only</option></select></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', color: 'var(--text)' }}><input type="checkbox" checked={f.existing} onChange={set('existing')} style={{ width: '1.4rem', height: '1.4rem' }} /> Count games already logged</label>
      </div>
      <label style={{ marginTop: '.6rem' }}>Name (optional, required for custom)<input type="text" placeholder="e.g. Beat my first Ultimate Master" value={f.title} onChange={set('title')} /></label>
      <div className="row2" style={{ marginTop: '.6rem' }}><button type="button" className="btn primary" onClick={save}>Save goal</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
      {g && <p><button type="button" className="btn danger" onClick={() => { del('goals', g.id); onClose(); }}>Delete goal</button></p>}
    </Overlay>
  );
}
