// Combo editor: keyboard-first notation entry with per-character move shortcuts.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLab } from '../../lab/store';
import { meNow, byId } from '../../lab/calc';
import { ROSTER } from '../../lab/data';
import { put, del } from '../../lab/store';
import { toggleFocus } from '../../lab/useLabActions';
import {
  newCb, comboStr, push, dir, down, up, sa, tok, back, MAC, TOKS, CM, CKEYS, MACK, TOKK, charKeyToken,
} from '../../lab/combo';
import { toast } from './toastBus';

export default function CombosPane() {
  const S = useLab(), me = meNow(S);
  const [cbObj] = useState(newCb), cb = useRef(cbObj), [, bump] = useState(0), re = () => bump((n) => n + 1);
  const [name, setName] = useState(''), [note, setNote] = useState(''), [char, setChar] = useState(me), [id, setId] = useState(null), [arm, setArm] = useState(null);
  const line = useRef(null), root = useRef(null), ptr = useRef(null);
  const live = useRef({});
  useLayoutEffect(() => { live.current = { char, name, note, id, S }; });

  const reset = () => { cb.current.toks = []; cb.current.lt = null; setId(null); setName(''); setNote(''); re(); };
  const save = () => {
    const L = live.current;
    if (!cb.current.toks.length) { toast('Type a combo first'); return; }
    const old = L.id ? byId(L.S.combos, L.id) : null;
    const nm = (L.name || '').trim() || (old && old.name) || `Combo ${L.S.combos.length + 1}`;
    put('combos', L.id || 'c' + Date.now().toString(36), { name: nm, char: L.char || me, toks: cb.current.toks.slice(), note: (L.note || '').trim(), focus: old ? !!old.focus : false, focusAt: old ? old.focusAt : undefined, created: (old && old.created) || Date.now(), upd: Date.now() });
    toast(`Saved “${nm}”`); reset();
  };
  const saveRef = useRef(save);
  useLayoutEffect(() => { saveRef.current = save; });

  // keyboard: only when focus is in the editor (or nowhere), never inside a form field
  useEffect(() => {
    const kd = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || !root.current) return;
      const ae = document.activeElement, tg = ae && ae.tagName;
      if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
      if (ae && ae !== document.body && !root.current.contains(ae)) return;
      const k = e.key, low = k.length === 1 ? k.toLowerCase() : k, c = cb.current;
      const take = (fn) => { e.preventDefault(); fn(); re(); };
      if (/^[1-9]$/.test(k)) take(() => dir(c, k));
      else if ((low === 'p' || low === 'k') && e.shiftKey) take(() => { if (!e.repeat) push(c, low.toUpperCase() + low.toUpperCase()); });
      else if (low === 'p' || low === 'k') take(() => { if (!e.repeat) down(c, low.toUpperCase()); });
      else if (k === ' ') take(() => { c.lt = null; });
      else if (low === 's') take(() => sa(c));
      else if (MACK[low]) take(() => push(c, MACK[low]));
      else if (TOKK[k]) take(() => push(c, TOKK[k]));
      else if (CKEYS.includes(low) && charKeyToken(live.current.char, low)) take(() => push(c, charKeyToken(live.current.char, low)));
      else if (k === 'Backspace') take(() => back(c));
      else if (k === 'Enter' && (!ae || ae === document.body || ae === line.current)) take(() => saveRef.current());
    };
    const ku = (e) => {
      if (!root.current) return;
      const low = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if ((low === 'p' || low === 'k') && cb.current.hold[low.toUpperCase()] != null) { up(cb.current, low.toUpperCase()); re(); }
    };
    const pend = () => { if (ptr.current) { const k = ptr.current; ptr.current = null; up(cb.current, k); re(); } };
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    document.addEventListener('pointerup', pend); document.addEventListener('pointercancel', pend);
    return () => { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); document.removeEventListener('pointerup', pend); document.removeEventListener('pointercancel', pend); };
  }, []);

  const pkDown = (k) => (e) => { e.preventDefault(); ptr.current = k; down(cb.current, k); e.currentTarget.classList.add('down'); };
  const pkUp = (e) => e.currentTarget.classList.remove('down');
  const A = (fn) => () => { fn(cb.current); re(); };
  const toks = cbObj.toks;
  const moves = CM[char] || [];
  const list = S.combos.slice().sort((x, y) => (y.focus ? 1 : 0) - (x.focus ? 1 : 0) || (y.upd || 0) - (x.upd || 0));
  const edit = (c) => { cb.current.toks = (c.toks || []).slice(); cb.current.lt = null; setId(c.id); setName(c.name || ''); setNote(c.note || ''); setChar(c.char || me); re(); line.current && line.current.focus(); };
  const del2 = (c) => {
    if (arm === c.id) { setArm(null); if (id === c.id) reset(); del('combos', c.id); return; }
    setArm(c.id); setTimeout(() => setArm((a) => (a === c.id ? null : a)), 3000);
  };

  return (
    <div className="cb" ref={root}>
      <div className="cbhead">
        <input type="text" placeholder="Combo name (e.g. mid-screen BnB)" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
        <select aria-label="Character" value={char} onChange={(e) => setChar(e.target.value)}>{ROSTER.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="cbline" ref={line} tabIndex={0} role="textbox" aria-label="Combo input">
        {toks.length ? comboStr(toks) : <span className="ph">Click here, then type: 1–9 directions · P / K buttons · d = DRC</span>}<span className="caret" />
      </div>
      <div className="cbpad">
        <div className="dirs">{[7, 8, 9, 4, 5, 6, 1, 2, 3].map((n) => <button key={n} type="button" aria-label={`Direction ${n}`} onClick={A((c) => dir(c, String(n)))}>{n}</button>)}</div>
        <div className="pk">
          <button type="button" onPointerDown={pkDown('P')} onPointerUp={pkUp} onPointerCancel={pkUp} onClick={(e) => { if (e.detail === 0) { down(cb.current, 'P'); up(cb.current, 'P'); re(); } }}>P<kbd>p</kbd></button>
          <button type="button" onPointerDown={pkDown('K')} onPointerUp={pkUp} onPointerCancel={pkUp} onClick={(e) => { if (e.detail === 0) { down(cb.current, 'K'); up(cb.current, 'K'); re(); } }}>K<kbd>k</kbd></button>
          <button type="button" onClick={A((c) => push(c, 'PP'))}>PP<kbd>⇧P</kbd></button>
          <button type="button" onClick={A((c) => push(c, 'KK'))}>KK<kbd>⇧K</kbd></button>
          <button type="button" onClick={A((c) => push(c, 'DRC'))}>DRC<kbd>d</kbd></button>
          <button type="button" aria-label="Undo last" onClick={A(back)}>⌫</button>
        </div>
      </div>
      <div className="cbx">
        {TOKS.map((t) => <button key={t[1]} type="button" onClick={A((c) => tok(c, t[1]))}>{t[1]}<kbd>{t[0]}</kbd></button>)}
        <button type="button" onClick={A((c) => tok(c, 'SA'))}>SA<kbd>s</kbd></button>
      </div>
      <div className="cbmv">
        {MAC.map((m) => <button key={m[1]} type="button" onClick={A((c) => push(c, m[1]))}><b>{m[1]}</b><small>{m[2]}</small><kbd>{m[0]}</kbd></button>)}
        {moves.slice(0, CKEYS.length).map((m, i) => <button key={m[0]} type="button" className="chr" onClick={A((c) => push(c, m[0]))}><b>{m[0]}</b><small>{m[1]}</small><kbd>{CKEYS[i]}</kbd></button>)}
      </div>
      <input type="text" placeholder="Notes (optional): timing, spacing, hit-confirm…" autoComplete="off" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="cbacts"><button type="button" className="btn primary" onClick={save}>{id ? 'Update combo' : 'Save combo'}</button><button type="button" className="btn" onClick={reset}>Clear</button></div>
      <p className="mute cbhelp"><b>1–9</b> directions · <b>P</b>/<b>K</b> tap again to cycle LP→MP→HP→P (hold = P) · <b>Space</b> ends the cycle so LP LP works · <b>⇧P / ⇧K</b> = PP / KK · <b>d</b> DRC · <b>s</b> cycles SA1→SA2→SA3→CA · <b>q w e y u</b> = 236 214 623 41236 63214 · <b>a f g h</b> = charge, 22, 360 · <b>z v b n m l</b> = the selected character’s own moves · Backspace undoes · Enter saves</p>
      <h3 style={{ margin: '.3rem 0 0' }}>Saved combos <span className="mute" style={{ fontSize: '.8rem', fontWeight: 400 }}>tick one to keep it in view during sessions</span></h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        {!list.length && <p className="mute">No saved combos yet. Type one above, name it and hit Save.</p>}
        {list.map((c) => (
          <div key={c.id} className={`cbrow${c.focus ? ' foc' : ''}`}>
            <button type="button" className="cbtick" aria-pressed={!!c.focus} aria-label={`Focus on ${c.name}`} title="Tick to focus on this combo" onClick={() => toggleFocus(c.id)}>{c.focus ? '✓' : ''}</button>
            <div className="cbmain"><b>{c.name}</b> <span className="mute">{c.char || ''}</span><div className="cbstr mono">{comboStr(c.toks || [])}</div>{c.note && <div className="mute" style={{ fontSize: '.8rem' }}>{c.note}</div>}</div>
            <button type="button" className="mini" style={{ minWidth: '3.6rem', minHeight: '2.6rem' }} onClick={() => edit(c)}>Edit</button>
            <button type="button" className={`mini${arm === c.id ? ' danger' : ''}`} style={{ minWidth: '4.2rem', minHeight: '2.6rem' }} onClick={() => del2(c)}>{arm === c.id ? 'Sure?' : 'Delete'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
