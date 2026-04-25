import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { trackerStore } from '../../utils/tracker';

// Tilt + session preferences. Read/write tilt settings via the engine.
const SettingsPanel = ({ isOpen, onClose, onChange }) => {
  const [enabled, setEnabled]     = useState(false);
  const [streak, setStreak]       = useState(3);
  const [sessionMins, setMins]    = useState(90);
  const [winDrop, setWinDrop]     = useState(0.20);
  const [setLength, setSetLength] = useState('FT2');

  useEffect(() => {
    if (!isOpen) return;
    let cancel = false;
    (async () => {
      const t = await trackerStore.getTiltSettings();
      if (!cancel) {
        setEnabled(t.enabled);
        setStreak(t.lossStreak);
        setMins(t.sessionMins);
        setWinDrop(t.winRateDrop);
      }
    })();
    return () => { cancel = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const save = async (next) => {
    const merged = { enabled, lossStreak: streak, sessionMins, winRateDrop: winDrop, ...next };
    await trackerStore.setTiltSettings(merged);
    onChange?.(merged);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold">Tracker settings</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Tilt meter */}
          <section>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-white font-medium">Tilt meter</span>
                <p className="text-xs text-gray-500 mt-0.5">Suggest a break when things go sideways. Manual trigger always available even when off.</p>
              </div>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => { setEnabled(e.target.checked); save({ enabled: e.target.checked }); }}
                className="w-5 h-5 accent-purple-600 shrink-0 ml-3"
              />
            </label>

            {enabled && (
              <div className="mt-3 ml-1 space-y-3 text-sm">
                <NumField label="Loss streak (in a row)" value={streak} min={2} max={10}
                  onChange={(v) => { setStreak(v); save({ lossStreak: v }); }} />
                <NumField label="Session length (min)" value={sessionMins} min={30} max={240} step={15}
                  onChange={(v) => { setMins(v); save({ sessionMins: v }); }} />
                <NumField label="Win-rate drop threshold (%)"
                  value={Math.round(winDrop * 100)} min={5} max={50} step={5}
                  onChange={(v) => { setWinDrop(v / 100); save({ winRateDrop: v / 100 }); }} />
              </div>
            )}
          </section>

          <hr className="border-gray-800" />

          <section>
            <p className="text-white font-medium mb-2">Set defaults</p>
            <p className="text-xs text-gray-500 mb-3">Used when you start a session without picking explicitly.</p>
            <div className="flex gap-2">
              {['FT1','FT2','FT3'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSetLength(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    setLength === s ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const NumField = ({ label, value, onChange, min, max, step = 1 }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-gray-300 text-sm flex-1">{label}</span>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 bg-gray-800 text-white rounded-lg py-1.5 px-2 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none tabular-nums"
    />
  </div>
);

export default SettingsPanel;
