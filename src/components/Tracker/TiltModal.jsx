import { useEffect, useState } from 'react';
import { Coffee, X } from 'lucide-react';

// Break prompt: 10-min countdown timer, dismissible. Encouraging tone, not scolding.
const REASON_TEXT = {
  lossStreak:    (d) => `${d.streak} losses in a row — time to step back.`,
  sessionLength: (d) => `${d.minsElapsed} min in. A short break helps.`,
  winRateDrop:   (d) => `Win rate slipping (${Math.round(d.earlyRate * 100)}% → ${Math.round(d.overallRate * 100)}%). Reset before pushing more.`,
  manual:        () => 'Take a break, come back fresher.',
};

const TiltModal = ({ isOpen, reason, detail, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes
  const [running, setRunning] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isOpen) { setSecondsLeft(600); setRunning(false); }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen]);

  useEffect(() => {
    if (!running || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, secondsLeft]);

  if (!isOpen) return null;

  const message = (REASON_TEXT[reason] || REASON_TEXT.manual)(detail || {});
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-900 border border-purple-500/40 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-2">
          <Coffee className="w-8 h-8 text-purple-400" />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white" aria-label="Skip">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-white text-xl font-bold mb-1">Take a break?</h3>
        <p className="text-sm text-gray-400 mb-6">{message}</p>

        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-white tabular-nums mb-1">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <p className="text-xs uppercase tracking-wide text-gray-500">10 min suggested</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {!running ? (
            <button
              onClick={() => setRunning(true)}
              className="col-span-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold"
            >
              Start timer
            </button>
          ) : secondsLeft > 0 ? (
            <button
              onClick={() => setRunning(false)}
              className="col-span-2 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={onClose}
              className="col-span-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold"
            >
              Done — back to it
            </button>
          )}
          <button
            onClick={onClose}
            className="col-span-2 py-2 text-xs text-gray-500 hover:text-white"
          >
            Skip — keep playing
          </button>
        </div>
      </div>
    </div>
  );
};

export default TiltModal;
