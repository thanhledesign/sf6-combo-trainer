import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, BarChart3, Coffee, Trophy } from 'lucide-react';
import { trackerStore, activeSessionStats, currentLossStreak, tiltCheck } from '../../utils/tracker';
import QuickEntry from './QuickEntry';
import MatchList from './MatchList';
import AdvancedEntryModal from './AdvancedEntryModal';
import SettingsPanel from './SettingsPanel';
import TiltModal from './TiltModal';

// Main /tracker route. Quick-entry counter, today/session stats, recent
// matches, manual + automatic tilt prompts, and an advanced-entry modal
// for editing matches with full detail.

const TrackerPage = ({ characterMap, characterList, defaultYourCharacter }) => {
  const navigate = useNavigate();

  const [matches, setMatches]         = useState([]);
  const [stats, setStats]             = useState({ wins: 0, losses: 0, total: 0, winRate: 0, session: null });
  const [streak, setStreak]           = useState(0);
  const [tilt, setTilt]               = useState(null);   // {reason, detail} or null
  const [tiltOpen, setTiltOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const [advOpen, setAdvOpen]         = useState(false);
  const [editingMatch, setEditingMatch]   = useState(null);
  const [tiltSettings, setTiltSettings]   = useState({ enabled: false });

  const refresh = useCallback(async () => {
    const [s, t, sLoss, settings] = await Promise.all([
      activeSessionStats(),
      tiltCheck(),
      currentLossStreak(),
      trackerStore.getTiltSettings(),
    ]);
    setStats(s);
    setStreak(sLoss);
    setTiltSettings(settings);
    if (s.session) {
      const sessionMatches = await trackerStore.getMatchesForSession(s.session.id);
      setMatches(sessionMatches.sort((a, b) => b.timestamp - a.timestamp));
    } else {
      setMatches([]);
    }
    if (t && settings.enabled && (!tilt || tilt.reason !== t.reason)) {
      setTilt(t);
      setTiltOpen(true);
    } else if (!t) {
      setTilt(null);
    }
  // tilt is derived; including in deps would re-fire after we set it. Skip.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logQuick = async (result) => {
    await trackerStore.addMatch({ result, yourCharacter: defaultYourCharacter });
    await refresh();
  };

  const handleAdvancedSave = async (patch) => {
    if (editingMatch) {
      await trackerStore.updateMatch(editingMatch.id, patch);
    } else {
      await trackerStore.addMatch(patch);
    }
    setEditingMatch(null);
    await refresh();
  };

  const handleEnd = async () => {
    if (!stats.session) return;
    await trackerStore.endSession();
    await refresh();
  };

  const triggerTiltManual = () => {
    setTilt({ reason: 'manual', detail: {} });
    setTiltOpen(true);
  };

  const sessionAge = stats.session
    ? Math.round((Date.now() - stats.session.startedAt) / 60000)
    : 0;

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-5 sm:py-8">
        {/* Header */}
        <header className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-400 font-semibold">Tracker</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              {stats.session ? 'Session in progress' : 'Ready to play'}
            </h1>
            {stats.session && (
              <p className="text-sm text-gray-400 mt-1">
                {sessionAge} min · {stats.session.setLength}{stats.session.roundsPerGame ? ` · ${stats.session.roundsPerGame} rounds` : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={triggerTiltManual}
              aria-label="Take a break"
              title="Take a break"
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Coffee className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/tracker/stats')}
              aria-label="View stats"
              title="View stats"
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Tracker settings"
              title="Settings"
              className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Tilt banner — auto-detected, only when enabled and we have a current trigger */}
        {tilt && tiltSettings.enabled && !tiltOpen && (
          <button
            onClick={() => setTiltOpen(true)}
            className="w-full mb-4 p-3 rounded-xl bg-amber-600/15 border border-amber-500/40 text-left flex items-center gap-3 hover:bg-amber-600/20 transition-colors"
          >
            <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-200">Tilt meter pinged</p>
              <p className="text-xs text-amber-300/80 truncate">Tap to take a break.</p>
            </div>
          </button>
        )}

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <Stat label="Wins" value={stats.wins} cls="text-green-400" />
          <Stat label="Losses" value={stats.losses} cls="text-red-400" />
          <Stat label="Win rate" value={stats.total ? `${Math.round(stats.winRate * 100)}%` : '—'} cls="text-white" />
        </div>

        {streak >= 3 && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-900/20 border border-red-700/50 text-xs text-red-300">
            🔥 {streak}-loss streak in this session
          </div>
        )}

        {/* Quick entry */}
        <QuickEntry onWin={() => logQuick('W')} onLoss={() => logQuick('L')} />

        {/* Advanced entry trigger */}
        <button
          onClick={() => { setEditingMatch(null); setAdvOpen(true); }}
          className="w-full mt-3 py-2.5 text-sm text-gray-400 hover:text-white border border-dashed border-gray-700 hover:border-purple-500 rounded-xl transition-colors"
        >
          + Log details (character, opponent, notes, tags)
        </button>

        {/* Matches */}
        <section className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Matches</h2>
            {stats.session && (
              <button
                onClick={handleEnd}
                className="text-xs text-gray-500 hover:text-red-400 px-2 py-1 rounded hover:bg-red-900/20"
              >
                End session
              </button>
            )}
          </div>
          <MatchList
            matches={matches}
            characterMap={characterMap}
            onEdit={(m) => { setEditingMatch(m); setAdvOpen(true); }}
            onDelete={async (m) => { await trackerStore.deleteMatch(m.id); await refresh(); }}
          />
        </section>
      </div>

      <AdvancedEntryModal
        isOpen={advOpen}
        onClose={() => { setAdvOpen(false); setEditingMatch(null); }}
        characterList={characterList}
        initialMatch={editingMatch}
        defaultYourCharacter={defaultYourCharacter}
        onSave={handleAdvancedSave}
      />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onChange={() => refresh()}
      />
      <TiltModal
        isOpen={tiltOpen}
        reason={tilt?.reason}
        detail={tilt?.detail}
        onClose={() => setTiltOpen(false)}
      />
    </div>
  );
};

const Stat = ({ label, value, cls }) => (
  <div className="bg-gray-800/50 rounded-xl p-3 text-center">
    <div className={`text-2xl font-bold ${cls}`}>{value}</div>
    <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">{label}</div>
  </div>
);

export default TrackerPage;
