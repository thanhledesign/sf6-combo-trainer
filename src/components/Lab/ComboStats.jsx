// Damage + frame data for a saved combo: auto-calculated from the character's frame data and
// SF6 scaling, switchable between normal hit / counter hit / punish counter, with every value
// overridable by hand. Used in the Combos pane and the Punish Calculator.
import { useMemo, useState } from 'react';
import { calcCombo, finalStats, CH_ADV, PC_ADV } from '../../lab/comboCalc';
import { setComboMan } from '../../lab/useLabActions';
import './comboStats.css';

const NOMAN = {};
const MODES = [['hit', 'Hit'], ['ch', 'Counter'], ['pc', 'Punish counter']];
const sgn = (n) => (n == null ? '—' : n > 0 ? `+${n}` : `${n}`);
const FIELDS = [
  ['dmg', 'Hit damage', 'hit'], ['ch', 'Counter damage', 'ch'], ['pc', 'Punish counter damage', 'pc'],
  ['startup', 'Startup (f)', 'startup'], ['onHit', 'On hit', 'onHit'], ['onBlock', 'On block', 'onBlock'],
];

export default function ComboStats({ combo, moves, mode, onMode }) {
  const [own, setOwn] = useState('hit');
  const m = mode || own, setM = onMode || setOwn;
  const [open, setOpen] = useState(false), [bd, setBd] = useState(false);
  const man = combo.man || NOMAN;
  const calc = useMemo(() => calcCombo(combo.toks || [], moves || [], man), [combo.toks, moves, man]);
  const f = finalStats(calc, man);
  const anyManual = Object.values(f.manual).some(Boolean);
  const advAdj = m === 'pc' ? PC_ADV : m === 'ch' ? CH_ADV : 0;
  const set = (k, v) => setComboMan(combo.id, { ...man, [k]: v });
  const steps = calc.steps[m];

  return (
    <div className="cstat">
      <div className="cs-modes" role="group" aria-label="Damage type">
        {MODES.map(([k, l]) => (
          <button key={k} type="button" aria-pressed={m === k} onClick={() => setM(k)}>
            <span>{l}</span><b>{f[k] || '—'}{f.manual[k === 'hit' ? 'hit' : k] ? ' ✎' : ''}</b>
          </button>
        ))}
      </div>
      <div className="cs-line">
        <span>Start <b>{f.startup != null ? `${f.startup}f` : '—'}</b></span>
        <span>On hit <b>{f.onHit != null ? sgn(f.onHit + advAdj) : '—'}</b>{advAdj ? <i> ({m === 'pc' ? 'PC' : 'CH'})</i> : null}</span>
        <span>On block <b>{sgn(f.onBlock)}</b></span>
        <span>Hits <b>{calc.hits}</b></span>
        {calc.starterPenalty ? <span>Starter <b>−{calc.starterPenalty}%</b></span> : null}
        {calc.unmatched > 0 && <span className="warn" title="These moves weren't found in the frame data; the total is missing their damage. Enter a manual damage.">⚠ {calc.unmatched} unmatched</span>}
        {anyManual && <span className="man">✎ manual</span>}
      </div>
      <div className="cs-acts">
        <button type="button" aria-pressed={bd} onClick={() => setBd(!bd)}>{bd ? '▾' : '▸'} Breakdown</button>
        <button type="button" aria-pressed={open} onClick={() => setOpen(!open)}>{open ? '▾' : '▸'} Set values manually</button>
      </div>
      {bd && (
        <table className="cs-bd">
          <thead><tr><th>Move</th><th>Base</th><th>Scale</th><th>Dmg</th></tr></thead>
          <tbody>
            {steps.map((s, i) => (
              <tr key={i} className={s.unmatched ? 'bad' : ''}><td>{s.label}{s.move ? '' : ' ?'}</td><td>{s.base ?? '—'}</td><td>{s.scale}%</td><td>{s.dmg}</td></tr>
            ))}
            <tr className="tot"><td colSpan="3">Auto total</td><td>{calc.auto[m]}</td></tr>
          </tbody>
        </table>
      )}
      {open && (
        <div className="cs-man">
          <p>Leave a box empty to use the auto value (shown inside it). Fill it in to override.</p>
          <div className="cs-grid">
            {FIELDS.map(([k, l, fk]) => {
              const autoV = fk === 'hit' ? calc.auto.hit : fk === 'ch' ? calc.auto.ch : fk === 'pc' ? calc.auto.pc : fk === 'startup' ? calc.info.startup : fk === 'onHit' ? calc.info.onHit : calc.info.onBlock;
              return (
                <label key={k}>{l}
                  <input type="number" inputMode="numeric" value={man[k] ?? ''} placeholder={autoV == null ? 'auto' : `auto ${autoV}`}
                    onChange={(e) => set(k, e.target.value === '' ? '' : Number(e.target.value))} />
                </label>
              );
            })}
            <label>Starter scaling
              <select value={man.starter ?? ''} onChange={(e) => set('starter', e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">Auto ({calc.starterPenalty}%)</option>
                <option value={0}>None (0%)</option><option value={20}>20%</option><option value={30}>30%</option><option value={40}>40%</option>
              </select>
            </label>
          </div>
          {anyManual || man.starter !== undefined && man.starter !== '' ? <button type="button" className="cs-reset" onClick={() => setComboMan(combo.id, {})}>Reset all to auto</button> : null}
        </div>
      )}
    </div>
  );
}
