// Live session logger: start sheet, scrubbers, character grid, set bar, tags, W/L.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLab, useUI, getUI, setUI } from '../../lab/store';
import {
  cur, lastClosed, sg, sgm, wl, pct, lossRun, streakStr, stopOf, modeNow, modeName, meNow, opts, tagList, estMR, postMR, lastGame, sgn,
} from '../../lab/calc';
import { OPP, MODES } from '../../lab/data';
import { startSession, endSession, logGame, endSet, setMode, updateStop, saveResult } from '../../lab/useLabActions';
import { comboStr } from '../../lab/combo';
import { toast } from './toastBus';
import { MrScrub, Scale, Stepper, Tile, TagChips } from './ui';

const SL = { calm: ['Amped up', '1 flat · 5 wired'], focus: ['Focus', '1 foggy · 5 locked in'], hands: ['Hands warm', '1 cold · 5 loose'] };

export function FocusBar({ S, onToggle }) {
  const fc = S.combos.filter((c) => c.focus).sort((a, b) => (b.focusAt || 0) - (a.focusAt || 0));
  if (!fc.length) return null;
  return (
    <div className="focusbar">
      {fc.map((c) => (
        <button key={c.id} type="button" className="fchip" title="Tap to un-focus" onClick={() => onToggle(c.id)}>
          <b>{c.name}</b><span className="mono">{comboStr(c.toks || [])}</span>
        </button>
      ))}
    </div>
  );
}

export default function LogPane({ onEditLast, onFocusToggle }) {
  const S = useLab(), ui = useUI();
  const s = cur(S), o = opts(S), mode = modeNow(S), ranked = mode === 'ranked', me = meNow(S);
  const idle = !s;
  const shown = s || lastClosed(S);
  const hasLast = idle && !!shown;
  const os = s && s.openSet && s.openSet.mode === mode ? s.openSet : null;

  // log form
  const [form, setForm] = useState({ char: null, oppMR: null, myMR: null, myDirty: false, tags: {}, opp: '', note: '' });
  const patch = (p) => setForm((f) => ({ ...f, ...p }));
  // pre-session sheet
  const [chk, setChk] = useState({ calm: 3, focus: 3, hands: 3 });
  const [rule, setRule] = useState(S.settings.rule || '');
  const [cues, setCues] = useState(S.settings.cues || ['', '', '']);

  const last = lastGame(S);
  const est = estMR(S, me);
  const myMR = form.myDirty ? form.myMR : est;
  const defOpp = last && last.oppMR != null ? last.oppMR : (myMR || 1500);

  // the open set carries its opponent MR / name into the form
  const osKey = os ? `${os.id}:${os.n}` : '';
  useEffect(() => {
    if (os && form.oppMR == null && os.oppMR != null) patch({ oppMR: os.oppMR });
    if (os && !form.opp && os.opp) patch({ opp: os.opp });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osKey]);

  // result-screen "My MR" also becomes the last game's real after-MR (debounced)
  const res = useMemo(() => {
    if (!s || !last || last.sid !== s.id || (last.mode || 'ranked') !== 'ranked' || last.myMR == null) return null;
    return last;
  }, [s, last]);
  const R = useRef({ gid: null, my: null, tm: null });
  const setMy = (v) => {
    patch({ myMR: v, myDirty: true });
    if (res) {
      R.current.gid = res.id; R.current.my = v; clearTimeout(R.current.tm);
      R.current.tm = setTimeout(() => saveResult(res, v), 500);
    }
  };
  const noteText = () => {
    const b = form.myDirty ? '' : 'est. ';
    if (!res) return b ? '(est.)' : '';
    const my = R.current.gid === res.id && R.current.my != null ? R.current.my : postMR(S, res), d = my - res.myMR;
    return `(${b}last game ${sgn(d)}${res.oppMR != null ? ` · opp ${sgn(-d)}` : ''})`;
  };

  const resetForm = (keep) => setForm((f) => ({
    ...f, tags: {}, myDirty: false, note: '',
    ...(keep ? {} : { char: null, oppMR: null, opp: '' }),
  }));

  const pickChar = (c) => {
    if (os) { endSet(); patch({ char: os.char === c ? null : c }); }
    else patch({ char: form.char === c ? null : c });
  };
  const onLog = (r) => {
    const out = logGame(r, { char: form.char, oppMR: form.oppMR, myMR, opp: form.opp, note: form.note, tags: Object.keys(form.tags).filter((k) => form.tags[k]) });
    if (out.toast) toast(out.toast);
    if (!out.keep && !out.toast && !s) return;
    resetForm(!!out.keep);
  };

  // character grid sizing so every tile fits without scrolling
  const shownKey = `${shown ? shown.id : ''}:${idle}`;
  const grid = useRef(null);
  useEffect(() => {
    const g = grid.current; if (!g) return undefined;
    const fit = () => {
      const w = g.clientWidth, h = g.clientHeight, n = g.children.length; if (!w || !h || !n) return;
      let cols = Math.max(3, Math.ceil(Math.sqrt((n * w) / h)));
      while (cols < n && Math.ceil(n / cols) * (w / cols) > h) cols++;
      g.style.setProperty('--cols', cols); g.style.setProperty('--ts', `${w / cols}px`);
    };
    fit();
    const ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(g);
    return () => ro && ro.disconnect();
  }, [shownKey]);

  const selChar = os ? os.char : form.char;
  const hts = ui.hts || {};
  const sizeStyle = (k) => (hts[k] ? { flex: `0 0 ${hts[k]}px`, height: hts[k], maxHeight: 'none' } : undefined);

  // vertical splitters for tags / note / W-L (drag, double-click resets)
  const splitters = useRef({});
  const startSplit = (key) => (e) => {
    const el = splitters.current[key]; if (!el) return;
    const st = { y: e.clientY, h: el.getBoundingClientRect().height };
    const host = e.currentTarget.closest('.pane');
    const mv = (ev) => {
      const mx = host.clientHeight * 0.6, mn = 2.4 * 16;
      setUI({ hts: { ...getUI().hts, [key]: Math.max(mn, Math.min(mx, st.h + (st.y - ev.clientY))) } });
    };
    const end = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', end); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', end);
  };
  const resetSplit = (key) => () => { const h = { ...getUI().hts }; delete h[key]; setUI({ hts: h }); };
  const vsp = (k) => <div className="vsp" title="Drag to resize · double-click to reset" onPointerDown={startSplit(k)} onDoubleClick={resetSplit(k)} />;

  const all = shown ? sg(S, shown) : [], a = shown ? sgm(S, shown) : [], r2 = wl(a), run = lossRun(a), N = stopOf(shown), tl = tagList(S);
  const lights = Array.from({ length: Math.min(N, 10) }, (_, i) => <i key={i} className={i < run ? 'on' : ''} />);

  return (
    <section className="pane" id="p-log">
      {idle && (
        <div className={`startv${hasLast ? ' sheet' : ''}`}>
          <h2>Before you queue <span className="mute lastnote" style={{ fontSize: '.7rem', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>· last session shown behind</span></h2>
          <div className="scales">
            {['calm', 'focus', 'hands'].map((k) => (
              <Scale key={k} k={k} label={SL[k][0]} hint={SL[k][1]} value={chk[k]} pace={ui.space} onChange={(v) => setChk((c) => ({ ...c, [k]: v }))} />
            ))}
          </div>
          <div className="row2">
            <label>Session rule (one)<input type="text" value={rule} onChange={(e) => setRule(e.target.value)} placeholder="e.g. cr.HP every jump-in" /></label>
            <label>Stop after losses in a row<Stepper value={stopOf({ stop: S.settings.stop })} onDec={() => updateStop(Math.max(0, stopOf({ stop: S.settings.stop }) - 1))} onInc={() => updateStop(Math.min(10, stopOf({ stop: S.settings.stop }) + 1))} /></label>
          </div>
          <div className="row2">
            {[0, 1, 2].map((i) => (
              <input key={i} type="text" aria-label={`Cue word ${i + 1}`} placeholder={`Cue ${i + 1}`} value={cues[i] || ''} onChange={(e) => setCues((c) => { const n = [...c]; n[i] = e.target.value; return n; })} />
            ))}
          </div>
          <button type="button" className="btn primary huge" onClick={() => startSession({ rule: rule.trim(), cues: [0, 1, 2].map((i) => (cues[i] || '').trim()), check: chk })}>Start session</button>
        </div>
      )}

      {shown && (
        <div className={`livev${idle ? ' idle' : ''}`}>
          <div className={`chargrid${selChar ? ' has-sel' : ''}`} ref={grid}>
            {OPP.map((c) => <Tile key={c} c={c} pressed={c === selChar} badge={c === selChar && os ? `${os.w}–${os.l}` : ''} onClick={() => pickChar(c)} />)}
          </div>
          <div className="modetabs">
            {MODES.map((m) => { const r = wl(all.filter((g) => (g.mode || 'ranked') === m[0])); return (
              <button key={m[0]} type="button" className="chip" aria-pressed={m[0] === mode} onClick={() => { setMode(m[0]); resetForm(false); }}>{m[1]} <span className="mono">{r.w}–{r.l}</span></button>
            ); })}
            <button type="button" className="mini" style={{ marginLeft: 'auto', minWidth: '4.5rem' }} onClick={onEditLast}>Edit last</button>
          </div>
          <div className="strip">
            <div className="stat"><b>{r2.w}–{r2.l}</b><span>Record</span></div>
            <div className="stat"><b>{pct(r2.w, r2.n)}</b><span>Win</span></div>
            <div className="stat"><b>{streakStr(a)}</b><span>Streak</span></div>
            {ranked ? (
              <div className="stat">
                <div className="lights" aria-label={`${run} losses in a row`}>{N > 0 ? lights : <span className="mute">no limit</span>}</div>
                <span className="stopctl">
                  <button type="button" className="mini" aria-label="Lower stop limit" onClick={() => updateStop(Math.max(0, N - 1))}>−</button>
                  Stop {N > 0 ? N : 'never'}
                  <button type="button" className="mini" aria-label="Raise stop limit" onClick={() => updateStop(Math.min(10, N + 1))}>+</button>
                </span>
              </div>
            ) : <div className="stat"><b>{a.length}</b><span>Games in {modeName(mode)}</span></div>}
            <button type="button" className="stat" onClick={endSession}><b>End</b><span>session</span></button>
          </div>
          <FocusBar S={S} onToggle={onFocusToggle} />
          {os ? (
            <div className="setbar">
              <b>Set vs {os.char}{os.opp ? ` · ${os.opp}` : ''}</b><span className="mono">{os.w}–{os.l}</span>
              <span className="mute">{ranked && o.setLen > 0 ? `game ${os.n + 1} of ${o.setLen}` : 'rematch'}</span>
              <button type="button" className="btn" onClick={() => { endSet(); resetForm(false); }}>Next opponent</button>
            </div>
          ) : form.char ? (
            <div className="setbar"><b>{form.char}</b><span className="mute">New opponent. The next result is game 1; after that it counts as a rematch.</span></div>
          ) : null}
          <div className="mrrow">
            {o.show.oppMR && ranked && (
              <div id="fOpp"><label>Opponent MR <i style={{ fontStyle: 'normal' }}>(drag ↕)</i></label>
                <MrScrub id="oppMR" label="Opponent MR" value={form.oppMR} base={defOpp} pace={ui.pace} onChange={(v) => patch({ oppMR: v })} /></div>
            )}
            {o.show.myMR && ranked && (
              <div id="fMy"><label>My MR <i style={{ fontStyle: 'normal' }}>{noteText()}</i></label>
                <MrScrub id="myMR" label="My MR" value={myMR} base={1500} pace={ui.pace} onChange={setMy} /></div>
            )}
            {o.show.oppName && (
              <div id="fName"><label htmlFor="opp">Opponent name</label>
                <input id="opp" type="text" autoComplete="off" placeholder="Name" value={form.opp} onChange={(e) => patch({ opp: e.target.value })} /></div>
            )}
          </div>
          {o.show.tags && (<>
            {vsp('tags')}
            <div id="tags" className="chips" ref={(el) => { splitters.current.tags = el; }} style={sizeStyle('tags')}>
              <TagChips tags={tl} sel={form.tags} onToggle={(k) => patch({ tags: { ...form.tags, [k]: !form.tags[k] } })}
                extra={<button type="button" className="chip add" onClick={() => window.dispatchEvent(new CustomEvent('lab:tags'))}>+ New / edit tags</button>} />
            </div>
          </>)}
          {o.show.note && (<>
            {vsp('note')}
            <textarea id="note" aria-label="Note" placeholder="Note (optional)" ref={(el) => { splitters.current.note = el; }} style={sizeStyle('note')} value={form.note} onChange={(e) => patch({ note: e.target.value })} />
          </>)}
          {vsp('wl')}
          <div className="wl" ref={(el) => { splitters.current.wl = el; }} style={sizeStyle('wl')}>
            <button type="button" className="big win" onClick={() => onLog('W')}>Won</button>
            <button type="button" className="big loss" onClick={() => onLog('L')}>Lost</button>
          </div>
        </div>
      )}
    </section>
  );
}
