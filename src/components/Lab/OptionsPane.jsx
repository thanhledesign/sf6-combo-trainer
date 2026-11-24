import { useState } from 'react';
import { useLab, useRaw, useUI, setUI, saveSettings } from '../../lab/store';
import { cur, opts, optGet, stopOf, tagList, tagObjs, themeList, strip, clamp } from '../../lab/calc';
import { put } from '../../lab/store';
import { setOpt, updateStop, endSession } from '../../lab/useLabActions';
import { toast } from './toastBus';
import { Overlay, Stepper } from './ui';
import SyncGuide from './SyncGuide';

const DASH_TILES = [['record', 'Record'], ['win', 'Win rate'], ['streak', 'Streak'], ['mr', 'MR now'], ['lights', 'Loss lights'], ['games', 'Games'], ['minutes', 'Minutes'], ['rule', 'Rule and cue words'], ['dots', 'Last games strip'], ['rematch', 'New vs rematch'], ['goal', 'Top goal']];

function Sw({ label, k, help }) {
  const S = useLab();
  return (
    <div className="orow"><div>{label}{help && <small>{help}</small>}</div>
      <button type="button" className="sw" role="switch" aria-checked={!!optGet(S, k)} aria-label={label} onClick={() => setOpt(k, !optGet(S, k))}><i /></button></div>
  );
}
function St({ label, value, help, suffix, onDec, onInc }) {
  return <div className="orow"><div>{label}{help && <small>{help}</small>}</div><Stepper value={value} suffix={suffix} onDec={onDec} onInc={onInc} /></div>;
}

export function OptionsPane({ onTags, onCsv }) {
  const S = useLab(), ui = useUI(), o = opts(S), s = cur(S);
  const [rule, setRule] = useState(s ? s.rule || '' : S.settings.rule || '');
  const [cues, setCues] = useState((s ? s.cues : S.settings.cues) || ['', '', '']);
  const commitText = () => {
    const c = [0, 1, 2].map((i) => (cues[i] || '').trim()), r = rule.trim();
    if (s) put('sessions', s.id, { ...strip(s), rule: r, cues: c });
    saveSettings({ rule: r, cues: c });
  };
  const stop = stopOf(s || { stop: S.settings.stop });
  return (
    <div id="opts">
      <h3>Stop rule</h3>
      <St label="Stop after losses in a row" value={stop} help="0 = never. Changes the live session too." onDec={() => updateStop(clamp(stop - 1, 0, 10))} onInc={() => updateStop(clamp(stop + 1, 0, 10))} />
      <h3>Session caps</h3>
      <St label="Stop after games" value={o.capGames} help="0 = off. Games this session in the current mode" onDec={() => setOpt('capGames', clamp(o.capGames - 1, 0, 60))} onInc={() => setOpt('capGames', clamp(o.capGames + 1, 0, 60))} />
      <St label="Stop after wins" value={o.capWins} help="0 = off. Quit while ahead" onDec={() => setOpt('capWins', clamp(o.capWins - 1, 0, 30))} onInc={() => setOpt('capWins', clamp(o.capWins + 1, 0, 30))} />
      <St label="Stop after a win streak of" value={o.capStreak} help="0 = off. Lock in the hot run" onDec={() => setOpt('capStreak', clamp(o.capStreak - 1, 0, 15))} onInc={() => setOpt('capStreak', clamp(o.capStreak + 1, 0, 15))} />
      <St label="Stop after minutes" value={o.capMin} suffix="min" help="0 = off. Your data says autopilot starts near 45" onDec={() => setOpt('capMin', clamp(o.capMin - 5, 0, 240))} onInc={() => setOpt('capMin', clamp(o.capMin + 5, 0, 240))} />
      <Sw label="Lock the log until I write a situation" k="lock" />
      {o.lock && <St label="Minimum note length" value={o.lockMin} help="characters" onDec={() => setOpt('lockMin', clamp(o.lockMin - 1, 0, 60))} onInc={() => setOpt('lockMin', clamp(o.lockMin + 1, 0, 60))} />}
      <h3>Ranked sets (rematches)</h3>
      <St label="Games per set" value={o.setLen} help="The opponent stays selected until the set ends. 0 = never auto-end" onDec={() => setOpt('setLen', clamp(o.setLen - 1, 0, 9))} onInc={() => setOpt('setLen', clamp(o.setLen + 1, 0, 9))} />
      <Sw label="End the set early when someone clinches" k="setEarly" help="e.g. 2–0 in a set of 3" />
      <h3>Log fields</h3>
      <Sw label="Opponent MR" k="show.oppMR" /><Sw label="My MR" k="show.myMR" /><Sw label="Opponent name" k="show.oppName" /><Sw label="Tags" k="show.tags" /><Sw label="Note box" k="show.note" /><Sw label="Game plan theme" k="show.theme" help="Pick the theme you are playing; game history shows win rate per theme" /><Sw label="Rage meter" k="show.rage" help="Peace to nuclear slider in the session screen" /><Sw label="Rage warnings" k="rageWarn" help="Banner when rage and losses stack up" />
      <h3>Live dashboard tiles</h3>
      {DASH_TILES.map((x) => <Sw key={x[0]} label={x[1]} k={`dash.${x[0]}`} />)}
      <St label="Games in the last-games strip" value={o.dotsN} onDec={() => setOpt('dotsN', clamp(o.dotsN - 1, 4, 30))} onInc={() => setOpt('dotsN', clamp(o.dotsN + 1, 4, 30))} />
      <h3>Feel (this device)</h3>
      <St label="MR drag pace" value={ui.pace} suffix="px" help="pixels of drag per +1. Lower = faster. Shift while dragging = 5x faster." onDec={() => setUI({ pace: clamp(ui.pace - 1, 2, 40) })} onInc={() => setUI({ pace: clamp(ui.pace + 1, 2, 40) })} />
      <St label="Scale drag pace" value={ui.space} suffix="px" help="pixels per step on calm / focus / hands" onDec={() => setUI({ space: clamp(ui.space - 4, 8, 120) })} onInc={() => setUI({ space: clamp(ui.space + 4, 8, 120) })} />
      <St label="Screen size" value={ui.scale} suffix="%" help="scales everything in the tracker" onDec={() => setUI({ scale: clamp(ui.scale - 10, 70, 180) })} onInc={() => setUI({ scale: clamp(ui.scale + 10, 70, 180) })} />
      <h3>MR estimate</h3>
      <St label="Rating change factor" value={o.k} help="16 matches your logged MR changes" onDec={() => setOpt('k', clamp(o.k - 1, 8, 40))} onInc={() => setOpt('k', clamp(o.k + 1, 8, 40))} />
      <h3>Session text</h3>
      <label>Rule<input type="text" value={rule} onChange={(e) => setRule(e.target.value)} onBlur={commitText} /></label>
      <div className="row2" style={{ marginTop: '.4rem' }}>
        {[0, 1, 2].map((i) => <input key={i} type="text" aria-label={`Cue ${i + 1}`} value={cues[i] || ''} onChange={(e) => setCues((c) => { const n = [...c]; n[i] = e.target.value; return n; })} onBlur={commitText} />)}
      </div>
      <h3>Tags and data</h3>
      <div className="row2">
        <button type="button" className="btn" onClick={onTags}>Manage tags</button>
        <button type="button" className="btn" onClick={() => window.dispatchEvent(new CustomEvent('lab:themes'))}>Manage themes</button>
        <button type="button" className="btn" onClick={onCsv}>Export CSV</button>
        <DataButtons />
        {s && <button type="button" className="btn danger" onClick={endSession}>End session</button>}
      </div>
    </div>
  );
}

// Backup / restore of the Lab's browser-local data (used to move from the old standalone tracker).
function DataButtons() {
  const S = useRaw(); // backups cover every account
  const [guide, setGuide] = useState(false);
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `session-lab-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importJson = (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return;
    f.text().then((t) => {
      const d = JSON.parse(t); let n = 0;
      ['games', 'sessions', 'goals', 'streaks', 'combos', 'reviews'].forEach((coll) => {
        const have = new Set(S[coll].map((x) => x.id));
        (d[coll] || []).forEach((x) => { if (x && x.id && !have.has(x.id)) { put(coll, x.id, strip(x)); n++; } });
      });
      if (d.settings && !Object.keys(S.settings).length) saveSettings(d.settings);
      toast(`Imported ${n} new record${n === 1 ? '' : 's'}`);
    }).catch(() => toast('That file is not a Session Lab export'));
  };
  return (
    <>
      <button type="button" className="btn" onClick={exportJson}>Back up data (JSON)</button>
      <label className="btn" style={{ textAlign: 'center', cursor: 'pointer', color: 'var(--text)', fontSize: '1rem' }}>Import backup<input type="file" accept="application/json,.json" hidden onChange={importJson} /></label>
      <button type="button" className="btn" onClick={() => setGuide(true)}>Save &amp; sync guide</button>
      {guide && <SyncGuide onClose={() => setGuide(false)} />}
    </>
  );
}

export function TagManager({ onClose }) {
  const S = useLab(), [name, setName] = useState(''), [type, setType] = useState('leak');
  const list = tagObjs(S);
  const save = (l) => saveSettings({ tags: l });
  return (
    <Overlay onClose={onClose}>
      <h2>Tags</h2>
      <p className="mute" style={{ fontSize: '.8rem' }}>Rename, change type, delete, or add your own. Old games keep their tags.</p>
      {tagList(S).map((t) => (
        <div className="tmrow" key={t[0]}>
          <input type="text" defaultValue={t[1]} aria-label="Tag name" onBlur={(e) => { const v = e.target.value.trim(); if (!v) { e.target.value = t[1]; return; } save(list.map((x) => (x.k === t[0] ? { ...x, n: v } : x))); }} />
          <select value={t[2]} aria-label="Tag type" onChange={(e) => save(list.map((x) => (x.k === t[0] ? { ...x, t: e.target.value } : x)))}><option value="leak">Leak</option><option value="good">Strength</option></select>
          <button type="button" className="btn danger" aria-label="Delete tag" style={{ padding: 0 }} onClick={() => { if (list.length <= 1) { toast('Keep at least one tag'); return; } save(list.filter((x) => x.k !== t[0])); }}>✕</button>
        </div>
      ))}
      <div className="row2" style={{ marginTop: '.6rem' }}>
        <label>New tag<input type="text" placeholder="e.g. Panic jump" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Type<select value={type} onChange={(e) => setType(e.target.value)}><option value="leak">Leak (hurts me)</option><option value="good">Strength (helps me)</option></select></label>
      </div>
      <div className="row2" style={{ marginTop: '.6rem' }}>
        <button type="button" className="btn primary" onClick={() => { if (!name.trim()) { toast('Name the tag first'); return; } save([...list, { k: 'c' + Date.now().toString(36), n: name.trim(), t: type }]); setName(''); }}>Add tag</button>
        <button type="button" className="btn" onClick={onClose}>Done</button>
      </div>
    </Overlay>
  );
}

export function CsvModal({ text, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <h2>CSV</h2>
      <textarea readOnly style={{ minHeight: '12rem' }} value={text} onFocus={(e) => e.target.select()} />
      <p><button type="button" className="btn" onClick={onClose}>Close</button></p>
    </Overlay>
  );
}

export function ThemeManager({ onClose }) {
  const S = useLab(), [name, setName] = useState('');
  const list = themeList(S).map((t) => ({ k: t[0], n: t[1] }));
  const save = (l) => saveSettings({ themes: l });
  const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  return (
    <Overlay onClose={onClose}>
      <h2>Game plan themes</h2>
      <p className="mute" style={{ fontSize: '.8rem' }}>Names only. Pokes, moves, win tactics and counters for each theme live in the Game Plans tab of the SF6 Ranked Tracker sheet. Old games keep their theme.</p>
      {list.map((t) => (
        <div className="tmrow" key={t.k}>
          <input type="text" defaultValue={t.n} aria-label="Theme name" onBlur={(e) => { const v = e.target.value.trim(); if (!v) { e.target.value = t.n; return; } save(list.map((x) => (x.k === t.k ? { ...x, n: v } : x))); }} />
          <button type="button" className="btn" aria-label="Duplicate theme" style={{ padding: 0 }} onClick={() => { const i = list.findIndex((x) => x.k === t.k); const c = list.slice(); c.splice(i + 1, 0, { k: uid(), n: `${t.n} copy` }); save(c); }}>⧉</button>
          <button type="button" className="btn danger" aria-label="Delete theme" style={{ padding: 0 }} onClick={() => { if (list.length <= 1) { toast('Keep at least one theme'); return; } save(list.filter((x) => x.k !== t.k)); }}>✕</button>
        </div>
      ))}
      <div className="row2" style={{ marginTop: '.6rem' }}>
        <label>New theme<input type="text" placeholder="e.g. Anti-zoner rush" value={name} onChange={(e) => setName(e.target.value)} /></label>
      </div>
      <div className="row2" style={{ marginTop: '.6rem' }}>
        <button type="button" className="btn primary" onClick={() => { if (!name.trim()) { toast('Name the theme first'); return; } save([...list, { k: uid(), n: name.trim() }]); setName(''); }}>Add theme</button>
        <button type="button" className="btn" onClick={onClose}>Done</button>
      </div>
    </Overlay>
  );
}
