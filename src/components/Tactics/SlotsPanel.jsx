import { useEffect, useRef, useState } from 'react';
import { X, Plus, Check, Trash2, Pencil, Download, Upload, AlertCircle } from 'lucide-react';
import {
  MAX_SLOTS,
  loadSlotsDoc,
  createSlot,
  renameSlot,
  deleteSlot,
  setActiveSlot,
  exportSlot,
  importSlot,
  snapshotFactory,
} from '../../utils/tacticsSlots';

// Manage the up-to-5 named slots per character. Switch active, rename,
// delete (confirm), export (JSON download), import (JSON file upload).

const SlotsPanel = ({
  isOpen,
  onClose,
  characterId,
  characterMoves,
  onSlotsChange,
}) => {
  const [doc, setDoc] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const refresh = async () => {
    const next = await loadSlotsDoc(characterId);
    setDoc(next);
    onSlotsChange?.(next);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isOpen && characterId) refresh(); }, [isOpen, characterId]);

  if (!isOpen || !doc) return null;

  const slots = doc.slots;
  const atCap = slots.length >= MAX_SLOTS;

  const handleNew = async (fromFactory) => {
    setError(null);
    try {
      const slot = fromFactory
        ? snapshotFactory(characterMoves, `Slot ${slots.length + 1}`)
        : { name: `Slot ${slots.length + 1}`, tags: {}, ordering: {} };
      await createSlot(characterId, slot);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSetActive = async (slotId) => {
    await setActiveSlot(characterId, slotId);
    await refresh();
  };

  const handleClearActive = async () => {
    await setActiveSlot(characterId, null);
    await refresh();
  };

  const startRename = (slot) => {
    setRenamingId(slot.id);
    setRenameValue(slot.name);
  };

  const commitRename = async () => {
    if (renamingId && renameValue.trim()) {
      await renameSlot(characterId, renamingId, renameValue.trim());
      await refresh();
    }
    setRenamingId(null);
  };

  const handleDelete = async (slotId) => {
    await deleteSlot(characterId, slotId);
    setConfirmDeleteId(null);
    await refresh();
  };

  const handleExport = (slot) => {
    const payload = exportSlot(characterId, slot);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${characterId}-tactics-${slot.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset so the same file can be picked twice
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importSlot(characterId, payload);
      await refresh();
    } catch (err) {
      setError(err.message || 'Failed to import slot.');
    }
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
          <div>
            <h3 className="text-white font-semibold">Tactics slots</h3>
            <p className="text-xs text-gray-400">{slots.length} of {MAX_SLOTS} slots used</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Factory default option */}
          <button
            onClick={handleClearActive}
            className={`w-full text-left px-4 py-3 border-b border-gray-800 transition-colors ${
              !doc.activeSlotId ? 'bg-purple-600/10' : 'hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {!doc.activeSlotId && <Check className="w-4 h-4 text-purple-400" />}
              <span className="text-white font-medium">Factory default</span>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              The starting tags from the worksheet. Read-only — make a slot to customize.
            </p>
          </button>

          {/* User slots */}
          <ul className="divide-y divide-gray-800">
            {slots.map((slot) => {
              const isActive = slot.id === doc.activeSlotId;
              const isRenaming = slot.id === renamingId;
              const moveCount = Object.keys(slot.tags).length;
              return (
                <li key={slot.id} className={isActive ? 'bg-purple-600/10' : ''}>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      {isActive && <Check className="w-4 h-4 text-purple-400" />}
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            else if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-sm border border-purple-500 focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => handleSetActive(slot.id)}
                          className="text-white font-medium hover:underline"
                        >
                          {slot.name}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 ml-6 mb-2">
                      {moveCount} move{moveCount === 1 ? '' : 's'} tagged · modified {new Date(slot.modifiedAt).toLocaleDateString()}
                    </p>

                    {confirmDeleteId === slot.id ? (
                      <div className="ml-6 flex items-center gap-2">
                        <p className="text-xs text-red-400 flex-1">Delete "{slot.name}"?</p>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-gray-400 hover:text-white px-2 py-1">
                          Cancel
                        </button>
                        <button onClick={() => handleDelete(slot.id)} className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded">
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="ml-6 flex gap-1">
                        <IconBtn icon={Pencil} label="Rename" onClick={() => startRename(slot)} />
                        <IconBtn icon={Download} label="Export" onClick={() => handleExport(slot)} />
                        <IconBtn icon={Trash2} label="Delete" onClick={() => setConfirmDeleteId(slot.id)} danger />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {error && (
            <div className="m-4 flex items-start gap-2 p-3 bg-red-900/40 border border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 py-3 border-t border-gray-800 grid grid-cols-3 gap-2">
          <button
            disabled={atCap}
            onClick={() => handleNew(true)}
            className={`text-xs font-medium py-2 px-2 rounded-lg flex items-center justify-center gap-1 ${
              atCap
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> From factory
          </button>
          <button
            disabled={atCap}
            onClick={() => handleNew(false)}
            className={`text-xs font-medium py-2 px-2 rounded-lg flex items-center justify-center gap-1 ${
              atCap
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Empty slot
          </button>
          <button
            disabled={atCap}
            onClick={handleImportClick}
            className={`text-xs font-medium py-2 px-2 rounded-lg flex items-center justify-center gap-1 ${
              atCap
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>
    </div>
  );
};

const IconBtn = ({ icon, label, onClick, danger }) => {
  const IconComp = icon;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded ${danger ? 'text-red-400 hover:bg-red-900/40' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
    >
      <IconComp className="w-4 h-4" />
    </button>
  );
};

export default SlotsPanel;
