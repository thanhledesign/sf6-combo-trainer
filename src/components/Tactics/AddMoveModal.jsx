import { useEffect, useMemo, useState } from 'react';
import { X, Search, AlertTriangle } from 'lucide-react';
import { TACTICAL_CATEGORIES } from '../../data/tacticalCategories';
import { validateMoveForCategory } from '../../utils/tacticsSlots';

// Modal for picking a move to add to a category, or editing an existing
// move's tags. Shows the full character movelist with frame data preview;
// surfaces validation when adding to +OB / Super Arts.

const AddMoveModal = ({
  isOpen,
  onClose,
  characterMoves,
  // The category the user is currently editing (highlighted in the picker).
  // null = "tag any move" mode (used for the global slot editor).
  targetCategoryId = null,
  // Map of moveId → tags currently in the active slot (for showing existing tags)
  currentTags = {},
  // Called with (moveId, newTagsArray) when user confirms.
  onSave,
}) => {
  const [query, setQuery] = useState('');
  const [selectedMoveId, setSelectedMoveId] = useState(null);
  const [draftTags, setDraftTags] = useState([]);
  const [validationError, setValidationError] = useState(null);

  // Reset on open — sync internal draft state with prop changes. Rule
  // disable is intentional: this only fires when the modal opens, so the
  // "cascading renders" concern doesn't apply.
  useEffect(() => {
    if (!isOpen) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setQuery('');
    setSelectedMoveId(null);
    setDraftTags(targetCategoryId ? [targetCategoryId] : []);
    setValidationError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isOpen, targetCategoryId]);

  const filteredMoves = useMemo(() => {
    if (!characterMoves) return [];
    const q = query.trim().toLowerCase();
    return Object.values(characterMoves)
      .filter((m) => {
        if (!q) return true;
        const hay = `${m.displayName || ''} ${m.shortName || ''} ${m.notation || ''} ${m.input || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  }, [characterMoves, query]);

  const selectedMove = selectedMoveId ? characterMoves[selectedMoveId] : null;

  const toggleTag = (tagId) => {
    setValidationError(null);
    setDraftTags((prev) => {
      if (prev.includes(tagId)) return prev.filter((t) => t !== tagId);
      // Validate before adding
      if (selectedMove) {
        const v = validateMoveForCategory(selectedMove, tagId);
        if (!v.ok) {
          setValidationError(v.reason);
          return prev;
        }
      }
      return [...prev, tagId];
    });
  };

  const handleSelectMove = (moveId) => {
    setSelectedMoveId(moveId);
    setValidationError(null);
    // Pre-fill with current tags (if any), or the target category
    const existing = currentTags[moveId] || [];
    if (existing.length) setDraftTags(existing);
    else if (targetCategoryId) setDraftTags([targetCategoryId]);
    else setDraftTags([]);
  };

  const handleConfirm = () => {
    if (!selectedMoveId) return;
    // Final validation pass
    for (const tagId of draftTags) {
      const v = validateMoveForCategory(selectedMove, tagId);
      if (!v.ok) {
        setValidationError(v.reason);
        return;
      }
    }
    onSave(selectedMoveId, draftTags);
    onClose();
  };

  if (!isOpen) return null;

  const targetCat = targetCategoryId
    ? TACTICAL_CATEGORIES.find((c) => c.id === targetCategoryId)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-gray-900 border border-gray-700 sm:rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div>
            <h3 className="text-white font-semibold">
              {targetCat ? `Add move to ${targetCat.label}` : 'Edit move tags'}
            </h3>
            {targetCat && (
              <p className="text-xs text-gray-400">{targetCat.question}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, notation (5MP, 2MK, 623LP)…"
              className="w-full bg-gray-800 text-white pl-9 pr-3 py-2 rounded-lg text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Move list / detail */}
        <div className="flex-1 overflow-y-auto">
          {!selectedMoveId ? (
            <ul className="divide-y divide-gray-800">
              {filteredMoves.length === 0 && (
                <li className="px-4 py-6 text-center text-gray-500 text-sm">No moves match "{query}"</li>
              )}
              {filteredMoves.map((m) => {
                const ob = m?.opponentPerspective?.frameAdvantage?.onBlock;
                const oh = m?.opponentPerspective?.frameAdvantage?.onHit;
                const startup = m?.frameData?.startup;
                const has = currentTags[m.id]?.length > 0;
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => handleSelectMove(m.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors flex items-baseline gap-3"
                    >
                      <span className="text-white font-medium">{m.displayName || m.id}</span>
                      <span className="text-xs text-gray-500">{m.notation || m.shortName}</span>
                      <span className="ml-auto text-xs text-gray-500 tabular-nums whitespace-nowrap">
                        {startup != null && `${startup}f`}{ob != null && ` · ${ob >= 0 ? '+' : ''}${ob} OB`}{oh != null && ` · ${oh >= 0 ? '+' : ''}${oh} OH`}
                      </span>
                      {has && <span className="ml-2 text-xs text-purple-400">●</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4">
              <div className="flex items-baseline gap-3 mb-1">
                <h4 className="text-lg font-semibold text-white">{selectedMove.displayName}</h4>
                <span className="text-sm text-gray-400">{selectedMove.notation}</span>
              </div>
              <p className="text-xs text-gray-500 tabular-nums mb-4">
                {selectedMove?.frameData?.startup != null && `Startup ${selectedMove.frameData.startup}f`}
                {selectedMove?.opponentPerspective?.frameAdvantage?.onBlock != null && ` · ${selectedMove.opponentPerspective.frameAdvantage.onBlock >= 0 ? '+' : ''}${selectedMove.opponentPerspective.frameAdvantage.onBlock} on block`}
                {selectedMove?.opponentPerspective?.frameAdvantage?.onHit != null && ` · ${selectedMove.opponentPerspective.frameAdvantage.onHit >= 0 ? '+' : ''}${selectedMove.opponentPerspective.frameAdvantage.onHit} on hit`}
                {selectedMove?.damage != null && ` · ${selectedMove.damage} dmg`}
              </p>

              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                Tags <span className="normal-case text-gray-600">(first = primary)</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {TACTICAL_CATEGORIES.map((cat) => {
                  const active = draftTags.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleTag(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        active
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {active && <span className="mr-1">{draftTags.indexOf(cat.id) + 1}.</span>}
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {validationError && (
                <div className="flex items-start gap-2 p-3 bg-red-900/40 border border-red-800 rounded-lg mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-200">{validationError}</p>
                </div>
              )}

              <p className="text-xs text-gray-500 mb-3">
                {draftTags.length === 0
                  ? 'Pick at least one tag, or click Save to remove this move from all categories.'
                  : `Tag ${draftTags.length} / cap 2 (more allowed for genuinely exceptional moves).`}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMoveId(null)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!!validationError}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold ${
                    validationError
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMoveModal;
