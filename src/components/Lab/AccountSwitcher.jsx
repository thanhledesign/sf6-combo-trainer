// Account switcher: one tracker, several game accounts (Steam / PS5 / Switch 2 …).
// Each account keeps its own games, sessions, goals and MR; combos, reviews and options are shared.
import { useState } from 'react';
import { useLab, useRaw, acctOfRec } from '../../lab/store';
import { allGames, wl, estMR, meNow } from '../../lab/calc';
import { setAccount, addAccount, editAccount, removeAccount, assignLegacy, legacyCount } from '../../lab/useLabActions';
import { Overlay } from './ui';
import { toast } from './toastBus';

const PLATFORMS = ['Steam', 'PS5', 'Switch 2', 'Xbox', 'Other'];
const BADGE = { Steam: 'PC', PS5: 'PS', 'Switch 2': 'NS', Xbox: 'XB', Other: '··' };

export default function AccountSwitcher() {
  const S = useLab(), raw = useRaw(), [open, setOpen] = useState(false), [edit, setEdit] = useState(false);
  const [nm, setNm] = useState(''), [pl, setPl] = useState('Steam');
  const cur = S.accounts.find((a) => a.id === S.acct) || S.accounts[0];
  const legacy = legacyCount(raw);
  // quick per-account summary (games, record, MR) read from the raw records
  const sum = (a) => {
    const V = { ...raw, games: raw.games.filter((g) => acctOfRec(g, raw) === a.id), sessions: raw.sessions.filter((x) => acctOfRec(x, raw) === a.id) };
    const g = allGames(V); const r = wl(g);
    const mr = (() => { try { return estMR(V, meNow(raw)); } catch { return null; } })();
    return { n: g.length, w: r.w, l: r.l, mr };
  };

  return (
    <>
      <button type="button" className="acctbtn" onClick={() => setOpen(true)} aria-label={`Account: ${cur.name}. Tap to switch`}>
        <span className="abdg">{BADGE[cur.platform] || BADGE.Other}</span><span className="anm">{cur.name}</span><span aria-hidden="true">▾</span>
      </button>
      {open && (
        <Overlay onClose={() => setOpen(false)}>
          <h2>Account</h2>
          <p className="mute" style={{ margin: 0 }}>Each account has its own games, sessions, goals and MR. Combos, reviews and options are shared.</p>
          <div className="acctlist">
            {S.accounts.map((a) => { const m = sum(a); return (
              <div key={a.id} className={`acctrow${a.id === S.acct ? ' on' : ''}`}>
                <button type="button" className="acctpick" aria-pressed={a.id === S.acct} onClick={() => { setAccount(a.id); setOpen(false); toast(`Switched to ${a.name}`); }}>
                  <span className="abdg">{BADGE[a.platform] || BADGE.Other}</span>
                  <span className="atx"><b>{a.name}</b><small>{m.n ? `${m.w}–${m.l} · ${m.n} games${m.mr ? ` · ~${m.mr} MR` : ''}` : 'No games yet'}</small></span>
                  {a.id === S.acct && <span className="chk">✓</span>}
                </button>
                {edit && (
                  <span className="acctedit">
                    <input type="text" aria-label="Account name" value={a.name} onChange={(e) => editAccount(a.id, { name: e.target.value })} />
                    <select aria-label="Platform" value={a.platform} onChange={(e) => editAccount(a.id, { platform: e.target.value })}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
                    <button type="button" className="mini" onClick={() => { if (!removeAccount(a.id)) toast('Only an empty account can be removed (it has games, or it is the last one)'); }}>Remove</button>
                  </span>
                )}
              </div>
            ); })}
          </div>
          {edit && (
            <div className="acctadd">
              <input type="text" placeholder="New account name" value={nm} onChange={(e) => setNm(e.target.value)} />
              <select aria-label="Platform" value={pl} onChange={(e) => setPl(e.target.value)}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
              <button type="button" className="btn" onClick={() => { addAccount(nm, pl); setNm(''); setOpen(false); }}>Add account</button>
            </div>
          )}
          {edit && legacy > 0 && (
            <p className="mute" style={{ fontSize: '.8rem' }}>{legacy} older record{legacy === 1 ? '' : 's'} saved before accounts existed show under <b>{S.accounts[0].name}</b>.{' '}
              {S.accounts.slice(1).map((a) => <button key={a.id} type="button" className="mini" style={{ marginRight: '.3rem' }} onClick={() => { const n = assignLegacy(a.id); toast(`Moved ${n} record${n === 1 ? '' : 's'} to ${a.name}`); }}>Move to {a.name}</button>)}
            </p>
          )}
          <div className="row2">
            <button type="button" className="btn" onClick={() => setEdit(!edit)}>{edit ? 'Done editing' : 'Rename / add / remove'}</button>
            <button type="button" className="btn" onClick={() => setOpen(false)}>Close</button>
          </div>
        </Overlay>
      )}
    </>
  );
}
