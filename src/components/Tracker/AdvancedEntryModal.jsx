import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_LOSS_TAGS } from '../../utils/tracker';

// Modal for full match detail entry: your char, opponent char, notes, loss tags.
// Used for both new entries and edits.

const AdvancedEntryModal = ({
  isOpen,
  onClose,
  characterList,
  initialMatch = null,   // null = new entry; otherwise edit existing
  defaultYourCharacter = null,
  onSave,                // called with (matchPatch) — for create includes result; for edit just patches
  customLossTags = [],
}) => {
  const [result, setResult] = useState('W');
  const [yourCharacter, setYourCharacter] = useState(null);
  const [opponentCharacter, setOpponentCharacter] = useState(null);
  const [notes, setNotes] = useState('');
  const [lossTags, setLossTags] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setResult(initialMatch?.result ?? 'W');
    setYourCharacter(initialMatch?.yourCharacter ?? defaultYourCharacter ?? null);
    setOpponentCharacter(initialMatch?.opponentCharacter ?? null);
    setNotes(initialMatch?.notes ?? '');
    setLossTags(initialMatch?.lossTags ?? []);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, initialMatch, defaultYourCharacter]);

  if (!isOpen) return null;

  const allTags = [...DEFAULT_LOSS_TAGS, ...customLossTags];

  const toggleTag = (id) => {
    setLossTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleSave = () => {
    const patch = {
      result,
      yourCharacter: yourCharacter || undefined,
      opponentCharacter: opponentCharacter || undefined,
      notes: notes.trim() || undefined,
      lossTags: result === 'L' && lossTags.length > 0 ? lossTags : undefined,
    };
    onSave(patch);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-gray-900 border border-gray-700 sm:rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-white font-semibold">{initialMatch ? 'Edit match' : 'Log details'}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Result toggle */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Result</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setResult('W')}
                className={`py-2 rounded-lg font-semibold text-sm transition-colors ${
                  result === 'W' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Win
              </button>
              <button
                onClick={() => setResult('L')}
                className={`py-2 rounded-lg font-semibold text-sm transition-colors ${
                  result === 'L' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Loss
              </button>
            </div>
          </div>

          {/* Your character */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">You played</p>
            <select
              value={yourCharacter ?? ''}
              onChange={(e) => setYourCharacter(e.target.value || null)}
              className="w-full bg-gray-800 text-white rounded-lg py-2 px-3 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
            >
              <option value="">— Pick character —</option>
              {characterList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Opponent */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Opponent</p>
            <select
              value={opponentCharacter ?? ''}
              onChange={(e) => setOpponentCharacter(e.target.value || null)}
              className="w-full bg-gray-800 text-white rounded-lg py-2 px-3 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
            >
              <option value="">— Pick character —</option>
              {characterList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={result === 'L' ? 'What beat you? What did you miss?' : 'What worked? What clicked?'}
              rows={2}
              className="w-full bg-gray-800 text-white rounded-lg py-2 px-3 text-sm border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>

          {/* Loss tags — only for L */}
          {result === 'L' && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                What went wrong? <span className="normal-case text-gray-600">(top leaks aggregate over time)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => {
                  const active = lossTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-800 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            className="py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedEntryModal;
