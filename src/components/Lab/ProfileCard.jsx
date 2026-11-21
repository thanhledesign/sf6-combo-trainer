// Header card: big 1:1 art for the selected character + stats from your own logged games.
import { charStats, pct, fmtD } from '../../lab/calc';
import { thumbOf } from '../../lab/data';

const Chip = ({ label, value, sub }) => (
  <div className="pstat"><b>{value}</b><span>{label}</span>{sub ? <small>{sub}</small> : null}</div>
);

export default function ProfileCard({ S, me, onPick }) {
  const s = charStats(S, me), img = thumbOf(me);
  const rec = (x) => `${x.w}–${x.l}`;
  return (
    <button type="button" className="mecard" aria-label={`Playing as ${me}. Tap to change character`} onClick={onPick}>
      <span className="meart" style={img ? { backgroundImage: `url('${img}')` } : undefined} />
      <span className="mebody">
        <span className="mename">{me}<span className="c">▾</span></span>
        {s.n === 0 ? (
          <span className="mute" style={{ fontSize: '.8rem' }}>No games logged as {me} yet</span>
        ) : (
          <span className="pgrid">
            {s.peak && <Chip label="Peak MR" value={s.peak.v} sub={fmtD(s.peak.t)} />}
            {s.now != null && <Chip label="MR now" value={s.now} />}
            <Chip label="Record" value={rec(s)} sub={`${pct(s.w, s.n)} · ${s.n} games`} />
            {s.best >= 2 && <Chip label="Best streak" value={`${s.best}W`} />}
            {s.bestWin && <Chip label="Best win" value={s.bestWin.oppMR} sub={s.bestWin.char || ''} />}
            {s.top && <Chip label="Best matchup" value={s.top.c} sub={`${rec(s.top)} · ${pct(s.top.w, s.top.n)}`} />}
            {s.worst && s.worst.c !== (s.top && s.top.c) && <Chip label="Toughest" value={s.worst.c} sub={`${rec(s.worst)} · ${pct(s.worst.w, s.worst.n)}`} />}
            {s.most && <Chip label="Most faced" value={s.most.c} sub={`${s.most.n} games`} />}
            {s.sessions > 0 && <Chip label="Sessions" value={s.sessions} sub={s.last ? `last ${fmtD(s.last)}` : ''} />}
          </span>
        )}
      </span>
    </button>
  );
}
