import React, { useState, useMemo } from 'react';
import { Calculator, Zap, Shield, Target, Swords } from 'lucide-react';
import MoveCard from '../Card/MoveCard';
import { useLab } from '../../lab/store';
import { charIdToName } from '../../lab/data';
import { comboStr, isDirs, isBtn } from '../../lab/combo';

// Punish groups, in display order. Normals come first: they're what you actually
// reach for at -4 to -8, so they must never be buried under big-damage specials/supers.
const GROUPS = [
  { key: 'normal', label: 'Normals' },
  { key: 'special', label: 'Specials' },
  { key: 'super', label: 'Super Arts' },
  { key: 'throw', label: 'Throws' },
  { key: 'other', label: 'Other' },
];
const startupOf = (m) => (typeof m.frameData?.startup === 'number' ? m.frameData.startup : null);
// Jump-ins and defensive utility (parry, perfect-parry strikes) are not punishes.
const isJump = (m) => /(^|_)n?j_|aerial/i.test(m.id || '') || /^j\./i.test(m.notation || '');
const isUtility = (m) => /parry|dash|step$|emergency/i.test(m.id || '') && m.category !== 'special';
const groupOf = (m) => (GROUPS.some((g) => g.key === m.category) ? m.category : 'other');
const norm = (x) => String(x || '').replace(/\s+/g, '').toUpperCase();

// A combo's starter = its first move: leading directions + button (2MK, 236HP), a bare button (LP → 5LP),
// or a named token (THROW, DI). Returns the move it starts with, if the character has it.
function starterMove(toks, moves) {
  if (!toks || !toks.length) return null;
  const t0 = toks[0], t1 = toks[1];
  if (t0 === 'j.') return null;
  const byNot = (n) => moves.find((m) => !isJump(m) && (norm(m.notation) === norm(n) || norm(m.shortName) === norm(n)));
  if (t0 === 'THROW') return moves.find((m) => m.category === 'throw') || null;
  if (t0 === 'DI') return moves.find((m) => /drive_impact/i.test(m.id || '')) || null;
  if (isDirs(t0) && t1 && isBtn(t1)) return byNot(t0 + t1);
  if (isBtn(t0)) return byNot('5' + t0) || byNot(t0) || byNot('236' + t0);
  return byNot(t0) || null;
}

const PunishCalculator = ({ characterData }) => {
  const [frameDisadvantage, setFrameDisadvantage] = useState('');
  const [sortBy, setSortBy] = useState('damage');
  const [filter, setFilter] = useState('all');
  const S = useLab();

  const moves = characterData?.moves;
  const allMoves = useMemo(() => Object.entries(moves || {}).map(([id, m]) => ({ ...m, id: m.id || id })), [moves]);
  const frameValue = parseInt(frameDisadvantage, 10);
  const punishableFrames = !isNaN(frameValue) && frameValue < 0 ? Math.abs(frameValue) : 0;

  const sorter = (a, b) => (sortBy === 'damage'
    ? (b.damage || 0) - (a.damage || 0) || (startupOf(a) || 99) - (startupOf(b) || 99)
    : (startupOf(a) || 99) - (startupOf(b) || 99) || (b.damage || 0) - (a.damage || 0));

  const punishOptions = useMemo(() => {
    if (!punishableFrames) return [];
    return allMoves.filter((m) => { const st = startupOf(m); return st != null && st <= punishableFrames && !isJump(m) && !isUtility(m); });
  }, [allMoves, punishableFrames]);

  const grouped = useMemo(() => {
    const out = {};
    for (const g of GROUPS) out[g.key] = punishOptions.filter((m) => groupOf(m) === g.key).sort(sorter);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [punishOptions, sortBy]);

  const categorizedPunishes = useMemo(() => {
    if (!punishOptions.length) return null;
    const byDmg = [...punishOptions].sort((a, b) => (b.damage || 0) - (a.damage || 0));
    const fastest = [...punishOptions].sort((a, b) => (startupOf(a) || 99) - (startupOf(b) || 99) || (b.damage || 0) - (a.damage || 0))[0];
    const bestNormal = byDmg.find((m) => m.category === 'normal');
    const safest = byDmg.find((m) => (m.opponentPerspective?.frameAdvantage?.onBlock ?? -99) >= -3);
    return { optimal: byDmg[0], fastest, bestNormal, safest, all: punishOptions };
  }, [punishOptions]);

  // Your own combos for this character whose starter is fast enough to punish.
  const myCombos = useMemo(() => {
    const name = charIdToName(characterData?.character?.id);
    if (!name || !punishableFrames) return { ok: [], slow: 0 };
    const mine = (S.combos || []).filter((c) => c.char === name);
    const ok = []; let slow = 0;
    for (const c of mine) {
      const mv = starterMove(c.toks || [], allMoves), st = mv ? startupOf(mv) : null;
      if (mv && st != null && st <= punishableFrames) ok.push({ c, mv, st }); else slow++;
    }
    ok.sort((a, b) => (b.c.focus ? 1 : 0) - (a.c.focus ? 1 : 0) || a.st - b.st);
    return { ok, slow };
  }, [S.combos, allMoves, characterData, punishableFrames]);

  if (!characterData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <p className="text-gray-400 text-center">No character selected. Please select a character first.</p>
      </div>
    );
  }

  // Quick preset buttons
  const presets = [
    { label: '-4', value: '-4', description: 'Light' },
    { label: '-6', value: '-6', description: 'Medium' },
    { label: '-8', value: '-8', description: 'Heavy' },
    { label: '-10', value: '-10', description: 'Full' },
    { label: '-15', value: '-15', description: 'Big' },
    { label: '-20+', value: '-25', description: 'Free' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Punish Calculator</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Enter the opponent's frame disadvantage. Results update as you type and include normals, specials, supers, throws and your own saved combos.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          {/* Input and Calculate Button - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="number"
              value={frameDisadvantage}
              onChange={(e) => setFrameDisadvantage(e.target.value)}
              placeholder="-6"
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-xl font-mono text-center sm:text-left"
            />
          </div>

          {/* Presets - Responsive grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {presets.map(preset => (
              <button
                key={preset.value}
                onClick={() => setFrameDisadvantage(preset.value)}
                className={`px-3 py-2 rounded-lg transition-colors text-center ${
                  frameDisadvantage === preset.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="font-mono font-bold block">{preset.label}</span>
                <span className="text-xs opacity-70 hidden sm:block">{preset.description}</span>
              </button>
            ))}
          </div>

          {/* How to use hint */}
          <p className="text-gray-500 text-xs mt-4">
            <strong>How to use:</strong> If opponent's move is "minus 6 on block," enter -6. The calculator shows which of your moves are fast enough to punish.
          </p>
        </div>

        {/* Results */}
        {categorizedPunishes && (
          <>
            {/* Quick picks */}
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-6 md:mb-8">
              {categorizedPunishes.bestNormal && (
                <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Swords className="w-5 h-5 text-purple-300" />
                    <span className="text-purple-300 font-semibold text-sm">Best Normal Punish</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{categorizedPunishes.bestNormal.displayName}</h3>
                  <p className="text-gray-300 font-mono text-sm mt-1">{categorizedPunishes.bestNormal.notation} • {categorizedPunishes.bestNormal.damage} dmg • {startupOf(categorizedPunishes.bestNormal)}f</p>
                </div>
              )}
              {categorizedPunishes.optimal && (
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-sm">Optimal Damage Punish</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{categorizedPunishes.optimal.displayName}</h3>
                  <p className="text-gray-300 font-mono text-sm mt-1">{categorizedPunishes.optimal.damage} dmg • {startupOf(categorizedPunishes.optimal)}f startup</p>
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2">{categorizedPunishes.optimal.yourPerspective?.tacticalUse}</p>
                </div>
              )}
              {categorizedPunishes.safest && categorizedPunishes.safest.id !== categorizedPunishes.optimal?.id && (
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold text-sm">Safest Option</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{categorizedPunishes.safest.displayName}</h3>
                  <p className="text-gray-300 font-mono text-sm mt-1">{categorizedPunishes.safest.damage} dmg • {startupOf(categorizedPunishes.safest)}f startup</p>
                </div>
              )}
            </div>

            {/* Your combos that qualify */}
            <section className="mb-6 md:mb-8" aria-label="Your combos that punish">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Zap className="w-5 h-5 text-purple-400" />Your combos</h2>
              {myCombos.ok.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myCombos.ok.map(({ c, mv, st }) => (
                    <div key={c.id || c.name} className="bg-gray-800 border border-purple-500/30 rounded-xl p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <b className="text-white">{c.name}{c.focus ? ' ★' : ''}</b>
                        <span className="text-xs text-purple-300 font-mono whitespace-nowrap">{mv.notation || mv.shortName} · {st}f</span>
                      </div>
                      <div className="font-mono text-gray-200 mt-1 break-words">{comboStr(c.toks || [])}</div>
                      {c.note && <p className="text-gray-400 text-xs mt-1">{c.note}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No saved combos for {characterData.character?.displayName || 'this character'} start with a move fast enough for {frameDisadvantage}.{' '}
                  <a href="/tracker/combos" className="text-purple-400 underline">Add combos</a></p>
              )}
              {myCombos.ok.length > 0 && myCombos.slow > 0 && <p className="text-gray-500 text-xs mt-2">{myCombos.slow} other saved combo{myCombos.slow === 1 ? '' : 's'} start too slow for this punish.</p>}
            </section>

            {/* Filter + sort */}
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Move type">
                {[{ key: 'all', label: `All ${categorizedPunishes.all.length}` }, ...GROUPS.filter((g) => grouped[g.key].length).map((g) => ({ key: g.key, label: `${g.label} ${grouped[g.key].length}` }))].map((f) => (
                  <button key={f.key} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
                    className={`px-3 py-1.5 rounded text-sm ${filter === f.key ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}>{f.label}</button>
                ))}
              </div>
              <div className="flex gap-2">
                {[['damage', 'Damage'], ['speed', 'Speed']].map(([k, l]) => (
                  <button key={k} onClick={() => setSortBy(k)} className={`px-3 py-1.5 rounded text-sm ${sortBy === k ? 'bg-gray-500 text-white' : 'bg-gray-700 text-gray-300'}`}>{l}</button>
                ))}
              </div>
            </div>

            {/* Every option, grouped */}
            {GROUPS.filter((g) => grouped[g.key].length && (filter === 'all' || filter === g.key)).map((g) => (
              <section key={g.key} className="mb-6">
                <h2 className="text-lg font-bold text-white mb-3">{g.label} <span className="text-gray-500 text-sm font-normal">({grouped[g.key].length})</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {grouped[g.key].map((m) => <MoveCard key={m.id} move={m} />)}
                </div>
              </section>
            ))}
          </>
        )}

        {/* Empty State */}
        {!categorizedPunishes && frameDisadvantage && parseInt(frameDisadvantage) < 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No punish options found for {frameDisadvantage} frames</p>
          </div>
        )}

        {/* Instruction State */}
        {!frameDisadvantage && (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <Calculator className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Enter a frame disadvantage to see punish options</p>
            <p className="text-gray-500 text-sm mt-2">
              Example: If opponent's move is -6 on block, enter -6
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PunishCalculator;
