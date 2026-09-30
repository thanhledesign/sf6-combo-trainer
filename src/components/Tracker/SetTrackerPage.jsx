import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, X, Undo2, Flag, BarChart3 } from 'lucide-react';
import { trackerStore, SF6_STAGES } from '../../utils/tracker';
import SwipeCard from './SwipeCard';

// Head-to-head set tracker — Tinder-style swipe to log each match in a set.
// State machine: PICKING → PLAYING → DONE.

const SET_LENGTHS = [
  { value: 1, label: 'FT1', desc: '1 match' },
  { value: 2, label: 'FT2', desc: 'Best of 3' },
  { value: 3, label: 'FT3', desc: 'Best of 5' },
  { value: 5, label: 'FT5', desc: 'Best of 9' },
];

const SetTrackerPage = ({ characterMap, characterList, thumbnailMap, defaultYourCharacter }) => {
  const navigate = useNavigate();
  const [activeSet, setActiveSet] = useState(null);
  const [phase, setPhase] = useState('loading');  // loading | picking | playing | done
  const [pickerYour, setPickerYour] = useState(defaultYourCharacter || null);
  const [pickerOpp, setPickerOpp]   = useState(null);
  const [setLength, setSetLength]   = useState(3);
  const [pickerStage, setPickerStage] = useState(null);
  const [completedSet, setCompletedSet] = useState(null);

  const refresh = useCallback(async () => {
    const s = await trackerStore.getActiveSet();
    setActiveSet(s);
    if (s) setPhase('playing');
    else setPhase('picking');
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);

  const start = async () => {
    if (!pickerYour || !pickerOpp) return;
    const s = await trackerStore.createSet({
      yourCharacter: pickerYour,
      opponentCharacter: pickerOpp,
      setLength,
    });
    // Stage isn't part of the set engine yet, but we keep it in component
    // state and attach to each match record. Future improvement: persist
    // on the set object itself.
    setActiveSet({ ...s, stage: pickerStage });
    setPhase('playing');
  };

  const handleSwipe = async (direction) => {
    // Each set match also writes a regular match record so it appears in
    // /tracker/stats — including the stage if one was picked at set start.
    const stage = activeSet?.stage || pickerStage || undefined;
    await trackerStore.addMatch({
      result: direction,
      yourCharacter: activeSet?.yourCharacter,
      opponentCharacter: activeSet?.opponentCharacter,
      stage,
    });
    const { set, complete } = await trackerStore.recordSetMatch(direction);
    if (complete) {
      setActiveSet(null);
      setCompletedSet(set);
      setPhase('done');
    } else {
      setActiveSet(set);
    }
  };

  const undo = async () => {
    const s = await trackerStore.undoSetMatch();
    setActiveSet(s ? { ...s } : null);
  };

  const abandon = async () => {
    await trackerStore.endSet();
    setActiveSet(null);
    setPhase('picking');
  };

  const newSet = () => {
    setCompletedSet(null);
    setPickerOpp(null);
    setPhase('picking');
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="max-w-md mx-auto px-4 py-5 sm:py-8">
        <header className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-purple-400 font-semibold">Tracker</p>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-0.5">Win/Loss Sets</h1>
          </div>
          <button
            onClick={() => navigate('/tracker/stats')}
            aria-label="View stats"
            className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
        </header>

        {phase === 'picking' && (
          <PickerView
            characterList={characterList}
            thumbnailMap={thumbnailMap}
            yourChar={pickerYour}
            oppChar={pickerOpp}
            setLength={setLength}
            stage={pickerStage}
            onYour={setPickerYour}
            onOpp={setPickerOpp}
            onLength={setSetLength}
            onStage={setPickerStage}
            onStart={start}
          />
        )}

        {phase === 'playing' && activeSet && (
          <PlayingView
            set={activeSet}
            characterMap={characterMap}
            thumbnailMap={thumbnailMap}
            onSwipe={handleSwipe}
            onUndo={undo}
            onAbandon={abandon}
          />
        )}

        {phase === 'done' && completedSet && (
          <DoneView
            set={completedSet}
            characterMap={characterMap}
            onNewSet={newSet}
            onBack={() => navigate('/tracker/stats')}
          />
        )}
      </div>
    </div>
  );
};

// ─── Picker view ────────────────────────────────────────────────────

const PickerView = ({ characterList, thumbnailMap, yourChar, oppChar, setLength, stage, onYour, onOpp, onLength, onStage, onStart }) => (
  <div>
    <p className="text-sm text-gray-400 mb-6">Pick characters, set length, then swipe per match.</p>

    <Section title="You">
      <CharGrid characters={characterList} thumbnailMap={thumbnailMap} selected={yourChar} onSelect={onYour} />
    </Section>

    <Section title="Opponent">
      <CharGrid characters={characterList} thumbnailMap={thumbnailMap} selected={oppChar} onSelect={onOpp} />
    </Section>

    <Section title="Set length">
      <div className="grid grid-cols-4 gap-2">
        {SET_LENGTHS.map((l) => (
          <button
            key={l.value}
            onClick={() => onLength(l.value)}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              setLength === l.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <div>{l.label}</div>
            <div className="text-[10px] opacity-70 font-normal">{l.desc}</div>
          </button>
        ))}
      </div>
    </Section>

    <Section title="Stage (optional)">
      <select
        value={stage ?? ''}
        onChange={(e) => onStage(e.target.value || null)}
        className="w-full bg-gray-800 text-white rounded-lg py-2 px-3 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
      >
        <option value="">— None —</option>
        {SF6_STAGES.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </Section>

    <button
      onClick={onStart}
      disabled={!yourChar || !oppChar}
      className={`w-full mt-6 py-3.5 rounded-xl text-base font-bold transition-colors ${
        yourChar && oppChar
          ? 'bg-purple-600 hover:bg-purple-700 text-white'
          : 'bg-gray-800 text-gray-600 cursor-not-allowed'
      }`}
    >
      Start set
    </button>
  </div>
);

// ─── Playing view ───────────────────────────────────────────────────

const PlayingView = ({ set, characterMap, thumbnailMap, onSwipe, onUndo, onAbandon }) => {
  const wins = set.matches.filter((m) => m === 'W').length;
  const losses = set.matches.filter((m) => m === 'L').length;
  const target = set.setLength;
  const yourThumb = thumbnailMap?.[set.yourCharacter];
  const oppThumb  = thumbnailMap?.[set.opponentCharacter];
  const yourName  = characterMap?.[set.yourCharacter]?.character?.displayName ?? set.yourCharacter;
  const oppName   = characterMap?.[set.opponentCharacter]?.character?.displayName ?? set.opponentCharacter;

  return (
    <div>
      {/* Score bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-center">
          <div className="text-4xl font-bold text-green-400 tabular-nums">{wins}</div>
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">You</div>
        </div>
        <div className="text-gray-600 text-xl">·</div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-0.5">First to {target}</div>
          <div className="flex gap-1 justify-center">
            {Array.from({ length: target }).map((_, i) => (
              <span
                key={`y${i}`}
                className={`w-2 h-2 rounded-full ${i < wins ? 'bg-green-500' : 'bg-gray-700'}`}
              />
            ))}
          </div>
          <div className="flex gap-1 justify-center mt-1">
            {Array.from({ length: target }).map((_, i) => (
              <span
                key={`o${i}`}
                className={`w-2 h-2 rounded-full ${i < losses ? 'bg-red-500' : 'bg-gray-700'}`}
              />
            ))}
          </div>
        </div>
        <div className="text-gray-600 text-xl">·</div>
        <div className="text-center">
          <div className="text-4xl font-bold text-red-400 tabular-nums">{losses}</div>
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-0.5">Opp</div>
        </div>
      </div>

      {/* Swipe card */}
      <SwipeCard onSwipe={onSwipe}>
        <div className="rounded-3xl bg-gradient-to-br from-purple-900/50 to-gray-800 border border-purple-500/40 p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            {yourThumb ? <img src={yourThumb} alt="" className="w-14 h-14 rounded-full border-2 border-green-400/50 object-cover" /> : <PlaceholderAvatar />}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-green-400 font-semibold">You</div>
              <div className="text-lg font-bold text-white truncate">{yourName}</div>
            </div>
          </div>

          <div className="text-center my-4">
            <span className="text-3xl font-black text-purple-400 tracking-wider">VS</span>
            <p className="text-xs text-gray-400 mt-1">Match {set.matches.length + 1}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 text-right">
              <div className="text-[10px] uppercase tracking-wide text-red-400 font-semibold">Opponent</div>
              <div className="text-lg font-bold text-white truncate">{oppName}</div>
            </div>
            {oppThumb ? <img src={oppThumb} alt="" className="w-14 h-14 rounded-full border-2 border-red-400/50 object-cover" /> : <PlaceholderAvatar />}
          </div>

          <p className="text-center text-xs text-gray-500 mt-5">
            Swipe right = you won · Swipe left = opp won
          </p>
        </div>
      </SwipeCard>

      {/* Fall-through buttons (touch / no-pointer fallbacks) */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          onClick={() => onSwipe('L')}
          className="py-3 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <X className="w-4 h-4" /> Opp wins
        </button>
        <button
          onClick={() => onSwipe('W')}
          className="py-3 rounded-xl bg-green-600/20 border border-green-500/40 text-green-300 hover:bg-green-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <Trophy className="w-4 h-4" /> You win
        </button>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={onUndo}
          disabled={set.matches.length === 0}
          className="text-xs text-gray-500 hover:text-white px-2 py-1 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-3 h-3" /> Undo last
        </button>
        <button
          onClick={onAbandon}
          className="text-xs text-gray-500 hover:text-red-400 px-2 py-1 flex items-center gap-1"
        >
          <Flag className="w-3 h-3" /> Abandon set
        </button>
      </div>

      {/* History strip */}
      {set.matches.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1.5">Match history</p>
          <div className="flex gap-1 flex-wrap">
            {set.matches.map((m, i) => (
              <span
                key={i}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                  m === 'W' ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
                }`}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Done view ─────────────────────────────────────────────────────

const DoneView = ({ set, characterMap, onNewSet, onBack }) => {
  const wins = set.matches.filter((m) => m === 'W').length;
  const losses = set.matches.filter((m) => m === 'L').length;
  const winnerYou = wins > losses;
  const yourName  = characterMap?.[set.yourCharacter]?.character?.displayName ?? set.yourCharacter;
  const oppName   = characterMap?.[set.opponentCharacter]?.character?.displayName ?? set.opponentCharacter;

  return (
    <div>
      <div className={`rounded-3xl p-6 text-center mb-5 ${winnerYou ? 'bg-green-600/10 border border-green-500/40' : 'bg-red-600/10 border border-red-500/40'}`}>
        <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: winnerYou ? '#86efac' : '#fca5a5' }}>
          Set {winnerYou ? 'won' : 'lost'}
        </p>
        <div className="text-5xl font-black text-white tabular-nums my-2">{wins} – {losses}</div>
        <p className="text-sm text-gray-400 mt-2">{yourName} vs {oppName}</p>
      </div>

      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-wide text-gray-500 mb-1.5">Match history</p>
        <div className="flex gap-1 flex-wrap">
          {set.matches.map((m, i) => (
            <span
              key={i}
              className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold ${
                m === 'W' ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
              }`}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBack}
          className="py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold"
        >
          View stats
        </button>
        <button
          onClick={onNewSet}
          className="py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold"
        >
          New set
        </button>
      </div>
    </div>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <section className="mb-5">
    <h2 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">{title}</h2>
    {children}
  </section>
);

const CharGrid = ({ characters, thumbnailMap, selected, onSelect }) => (
  <div className="grid grid-cols-4 gap-2">
    {characters.map((c) => {
      const thumb = thumbnailMap?.[c.id];
      const active = c.id === selected;
      return (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
            active
              ? 'border-purple-500 ring-2 ring-purple-500/50 scale-[1.03]'
              : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          {thumb ? (
            <img src={thumb} alt={c.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">{c.name}</div>
          )}
        </button>
      );
    })}
  </div>
);

const PlaceholderAvatar = () => (
  <div className="w-14 h-14 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center text-gray-500 text-xs">?</div>
);

export default SetTrackerPage;
