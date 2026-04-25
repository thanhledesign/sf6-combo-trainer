import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import {
  winRateByYourCharacter,
  winRateByMatchup,
  winRateByStage,
  topLossTags,
  DEFAULT_LOSS_TAGS,
  STAGE_BY_ID,
} from '../../utils/tracker';

const StatsPage = ({ characterMap, defaultYourCharacter }) => {
  const navigate = useNavigate();
  const [perChar, setPerChar]     = useState([]);
  const [matchups, setMatchups]   = useState([]);
  const [stages, setStages]       = useState([]);
  const [tags, setTags]           = useState([]);
  const [filterChar, setFilterChar] = useState(defaultYourCharacter || null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const [pc, mu, st, tg] = await Promise.all([
        winRateByYourCharacter(),
        winRateByMatchup(filterChar ? { yourCharacter: filterChar } : {}),
        winRateByStage(filterChar ? { yourCharacter: filterChar } : {}),
        topLossTags({ limit: 10, sinceTimestamp: Date.now() - 7 * 24 * 60 * 60 * 1000 }),
      ]);
      if (cancel) return;
      setPerChar(pc.sort((a, b) => b.total - a.total));
      setMatchups(mu.sort((a, b) => a.winRate - b.winRate)); // problem matchups first
      setStages(st.sort((a, b) => a.winRate - b.winRate));   // problem stages first
      setTags(tg);
    })();
    return () => { cancel = true; };
  }, [filterChar]);

  const tagLabels = useMemo(() => {
    const map = Object.fromEntries(DEFAULT_LOSS_TAGS.map((t) => [t.id, t.label]));
    return map;
  }, []);

  const charName = (id) => characterMap?.[id]?.character?.displayName || characterMap?.[id]?.character?.name || id;

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-5 sm:py-8">
        <button
          onClick={() => navigate('/tracker')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to tracker
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Stats</h1>

        {/* Per-character */}
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-3">By your character</h2>
          {perChar.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4">Log structured matches with your character set to see this. (Quick-entry matches without a character don't count here.)</p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {perChar.map((p) => (
                <li key={p.yourCharacter}>
                  <button
                    onClick={() => setFilterChar(p.yourCharacter)}
                    className={`w-full py-2.5 px-2 text-left flex items-center gap-3 rounded-lg ${filterChar === p.yourCharacter ? 'bg-purple-600/20' : 'hover:bg-gray-800/50'}`}
                  >
                    <span className="text-white text-sm flex-1">{charName(p.yourCharacter)}</span>
                    <span className="text-xs text-gray-500 tabular-nums">{p.wins}W-{p.losses}L</span>
                    <span className={`text-sm font-semibold tabular-nums w-12 text-right ${p.winRate >= 0.5 ? 'text-green-400' : 'text-amber-400'}`}>
                      {Math.round(p.winRate * 100)}%
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Matchups */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">
              Matchups{filterChar ? ` — ${charName(filterChar)} vs` : ''}
            </h2>
            {filterChar && (
              <button
                onClick={() => setFilterChar(null)}
                className="text-xs text-gray-500 hover:text-white"
              >
                Show all
              </button>
            )}
          </div>
          {matchups.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4">No matchup data yet — log matches with both characters set to see per-matchup win rates.</p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {matchups.map((m) => {
                const isProblem = m.total >= 3 && m.winRate < 0.4;
                return (
                  <li key={`${m.yourCharacter}__${m.opponentCharacter}`}>
                    <div className="py-2.5 px-2 flex items-center gap-3">
                      <span className="text-sm text-gray-300 flex-1 truncate">
                        {charName(m.yourCharacter)} <span className="text-gray-600">vs</span> {charName(m.opponentCharacter)}
                        {isProblem && <span className="ml-2 text-[10px] uppercase text-red-400 font-semibold">Problem</span>}
                      </span>
                      <span className="text-xs text-gray-500 tabular-nums">{m.wins}-{m.losses}</span>
                      <span className={`text-sm font-semibold tabular-nums w-12 text-right ${m.winRate >= 0.5 ? 'text-green-400' : 'text-amber-400'}`}>
                        {Math.round(m.winRate * 100)}%
                      </span>
                      <button
                        onClick={() => navigate(`/browse/${m.opponentCharacter}`)}
                        className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-600/10 flex items-center gap-1 shrink-0"
                        title={`Study ${charName(m.opponentCharacter)}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">Study</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Stage heatmap */}
        <section className="mb-8">
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-3">
            By stage{filterChar ? ` — ${charName(filterChar)}` : ''}
          </h2>
          {stages.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4">No stage data yet — pick a stage when logging matches to see per-stage win rates.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stages.map((s) => {
                const stageLabel = STAGE_BY_ID[s.stage]?.label || s.stage;
                const wr = s.winRate;
                // Heatmap color: red < 40%, amber 40-50%, lime 50-60%, green 60%+
                const tone = wr < 0.4
                  ? { bg: 'rgba(220,38,38,0.15)', text: '#fca5a5', border: 'rgba(220,38,38,0.4)' }
                  : wr < 0.5
                  ? { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.4)' }
                  : wr < 0.6
                  ? { bg: 'rgba(132,204,22,0.15)', text: '#bef264', border: 'rgba(132,204,22,0.4)' }
                  : { bg: 'rgba(34,197,94,0.15)', text: '#86efac', border: 'rgba(34,197,94,0.4)' };
                return (
                  <li
                    key={s.stage}
                    className="rounded-lg p-3 border"
                    style={{ backgroundColor: tone.bg, borderColor: tone.border }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm text-white truncate flex-1">{stageLabel}</p>
                      <span className="text-lg font-bold tabular-nums shrink-0" style={{ color: tone.text }}>
                        {Math.round(wr * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 tabular-nums">{s.wins}W-{s.losses}L · {s.total} matches</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Top leaks */}
        <section>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-3">Top leaks · last 7 days</h2>
          {tags.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4">No loss tags applied this week. Tag your losses with what went wrong to see patterns over time.</p>
          ) : (
            <ul className="space-y-1.5">
              {tags.map((t, i) => (
                <li key={t.id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 tabular-nums w-5 text-right">{i + 1}.</span>
                  <span className="text-sm text-gray-300 flex-1">{tagLabels[t.id] || t.id}</span>
                  <span className="text-xs text-gray-500 tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default StatsPage;
