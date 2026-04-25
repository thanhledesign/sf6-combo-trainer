import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Check, Settings } from 'lucide-react';
import { TACTICAL_CATEGORIES, DIVIDER_AFTER_ORDER } from '../../data/tacticalCategories';
import { countMovesByTag, getMovesByTag } from '../../utils/tacticalFilter';
import {
  loadSlotsDoc,
  applySlot,
  createSlot,
  snapshotFactory,
  updateMoveTags,
  updateOrdering,
  updateCategoryOrder,
} from '../../utils/tacticsSlots';
import TacticsCategorySection from './TacticsCategorySection';
import TacticsSubNav from './TacticsSubNav';
import AddMoveModal from './AddMoveModal';
import SlotsPanel from './SlotsPanel';

const TacticsPage = ({ characterMap, onCharacterEntered }) => {
  const { characterId, categoryId } = useParams();
  const navigate = useNavigate();
  const characterData = characterMap?.[characterId];

  // Sync the App-level selectedCharacterId with the URL — so the top-right
  // selector shows the right character when arriving via deep-link.
  useEffect(() => {
    if (characterId && onCharacterEntered) onCharacterEntered(characterId);
  }, [characterId, onCharacterEntered]);

  const [activeId, setActiveId] = useState(categoryId || TACTICAL_CATEGORIES[0].id);
  const [slotsDoc, setSlotsDoc] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [slotsPanelOpen, setSlotsPanelOpen] = useState(false);
  const [addModal, setAddModal] = useState({ open: false, targetCategoryId: null, moveId: null });

  // Active slot derived from doc
  const activeSlot = useMemo(() => {
    if (!slotsDoc?.activeSlotId) return null;
    return slotsDoc.slots.find((s) => s.id === slotsDoc.activeSlotId) ?? null;
  }, [slotsDoc]);

  // Effective moves dict (factory or slot override)
  const { moves: effectiveMoves, ordering } = useMemo(() => {
    if (!characterData) return { moves: {}, ordering: null };
    return applySlot(characterData.moves, activeSlot);
  }, [characterData, activeSlot]);

  const counts = useMemo(() => countMovesByTag(effectiveMoves), [effectiveMoves]);

  // Load slots on character change
  useEffect(() => {
    let cancelled = false;
    if (!characterId) return;
    (async () => {
      const doc = await loadSlotsDoc(characterId);
      if (!cancelled) setSlotsDoc(doc);
    })();
    return () => { cancelled = true; };
  }, [characterId]);

  // Default redirect if no character matches
  useEffect(() => {
    if (characterId && !characterData) navigate('/character/ken/tactics', { replace: true });
    else if (!characterId) navigate('/character/ken/tactics', { replace: true });
  }, [characterId, characterData, navigate]);

  // Initial scroll for deep-link
  const didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current) return;
    if (!characterData) return;
    if (!categoryId) {
      didInitialScroll.current = true;
      return;
    }
    const el = document.getElementById(`tactics-${categoryId}`);
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }));
      didInitialScroll.current = true;
    }
  }, [characterData, categoryId]);

  // IntersectionObserver to highlight the section currently in view
  useEffect(() => {
    if (!characterData) return;
    const sections = Array.from(document.querySelectorAll('[data-tactics-section]'));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.getAttribute('data-tactics-section');
          if (id) setActiveId(id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [characterData]);

  const handleSubNavSelect = (id) => {
    setActiveId(id);
    const el = document.getElementById(`tactics-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    navigate(`/character/${characterId}/tactics/${id}`, { replace: true });
  };

  // ─── Edit-mode operations (auto-save to active slot) ──────────────────

  /** Ensure there's an active slot before edits. If none, create one from factory. */
  const ensureActiveSlot = useCallback(async () => {
    if (activeSlot) return activeSlot;
    const snap = snapshotFactory(characterData.moves, 'My Slot');
    const doc = await createSlot(characterId, snap);
    setSlotsDoc(doc);
    return doc.slots.find((s) => s.id === doc.activeSlotId);
  }, [activeSlot, characterData, characterId]);

  const handleEnterEditMode = async () => {
    await ensureActiveSlot();
    setEditMode(true);
  };

  const handleSaveMoveTags = async (moveId, newTags) => {
    const slot = await ensureActiveSlot();
    if (!slot) return;
    const doc = await updateMoveTags(characterId, slot.id, moveId, newTags);
    setSlotsDoc(doc);
  };

  const handleAddMoveToCategory = (catId) =>
    setAddModal({ open: true, targetCategoryId: catId, moveId: null });

  const handleEditMove = (moveId) =>
    setAddModal({ open: true, targetCategoryId: null, moveId });

  const handleRemoveMoveFromCategory = async (moveId, catId) => {
    const slot = await ensureActiveSlot();
    if (!slot) return;
    const current = slot.tags[moveId] || effectiveMoves[moveId]?.tacticalTags || [];
    const next = current.filter((t) => t !== catId);
    const doc = await updateMoveTags(characterId, slot.id, moveId, next);
    setSlotsDoc(doc);
  };

  const handleReorderCategory = async (catId, direction) => {
    const slot = await ensureActiveSlot();
    if (!slot) return;
    // Resolve the current effective order
    const currentOrder = (slot.categoryOrder && slot.categoryOrder.length)
      ? [...slot.categoryOrder]
      : TACTICAL_CATEGORIES.map((c) => c.id);
    // If a category isn't in the custom list yet, append it
    for (const c of TACTICAL_CATEGORIES) {
      if (!currentOrder.includes(c.id)) currentOrder.push(c.id);
    }
    const idx = currentOrder.indexOf(catId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentOrder.length) return;
    [currentOrder[idx], currentOrder[newIdx]] = [currentOrder[newIdx], currentOrder[idx]];
    const doc = await updateCategoryOrder(characterId, slot.id, currentOrder);
    setSlotsDoc(doc);
  };

  const handleReorder = async (moveId, catId, direction) => {
    const slot = await ensureActiveSlot();
    if (!slot) return;
    // Get current rendered order in this category (post slot/ordering)
    const currentMoves = getMovesByTag(effectiveMoves, catId, slot.ordering);
    const currentOrder = currentMoves.map((m) => m.id);
    const idx = currentOrder.indexOf(moveId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= currentOrder.length) return;
    const next = [...currentOrder];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    const doc = await updateOrdering(characterId, slot.id, catId, next);
    setSlotsDoc(doc);
  };

  if (!characterData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen">
      <TacticsSubNav
        activeId={activeId}
        counts={counts}
        onSelect={handleSubNavSelect}
        variant="mobile"
        editMode={editMode}
        categoryOrder={activeSlot?.categoryOrder}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 lg:flex lg:gap-8">
        <TacticsSubNav
          activeId={activeId}
          counts={counts}
          onSelect={handleSubNavSelect}
          variant="desktop"
          editMode={editMode}
          categoryOrder={activeSlot?.categoryOrder}
          onReorderCategory={handleReorderCategory}
        />

        <main className="flex-1 min-w-0">
          {/* Header */}
          <header className="mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-400 font-semibold">
                Tactical Guide
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
                {characterData.character?.displayName || characterData.character?.name || characterId}
              </h1>
              <p className="text-sm text-gray-400 mt-2 max-w-2xl">
                {activeSlot ? (
                  <>Editing slot <span className="text-white font-medium">{activeSlot.name}</span> · changes save automatically.</>
                ) : (
                  <>The 3-6 moves that matter most in each tactical situation. <button onClick={() => navigate(`/browse/${characterId}`)} className="text-purple-400 hover:text-purple-300 underline">Browse</button> for the full movelist.</>
                )}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setSlotsPanelOpen(true)}
                aria-label="Manage slots"
                title="Manage slots"
                className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => editMode ? setEditMode(false) : handleEnterEditMode()}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  editMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                {editMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                {editMode ? 'Done' : 'Edit'}
              </button>
            </div>
          </header>

          {/* Sections — render order respects per-slot categoryOrder when set */}
          <div className="flex flex-col gap-10 md:gap-12">
            {(() => {
              const customOrder = activeSlot?.categoryOrder;
              let cats = TACTICAL_CATEGORIES;
              if (customOrder && customOrder.length) {
                const seen = new Set();
                const reordered = [];
                for (const id of customOrder) {
                  const cat = TACTICAL_CATEGORIES.find((c) => c.id === id);
                  if (cat && !seen.has(id)) { reordered.push(cat); seen.add(id); }
                }
                for (const cat of TACTICAL_CATEGORIES) {
                  if (!seen.has(cat.id)) reordered.push(cat);
                }
                cats = reordered;
              }
              const isCustom = !!(customOrder && customOrder.length);
              return cats.map((cat) => (
                <div key={cat.id}>
                  {!isCustom && cat.order === DIVIDER_AFTER_ORDER + 1 && (
                    <hr className="hidden lg:block border-gray-800 mb-12" aria-hidden />
                  )}
                  <TacticsCategorySection
                    category={cat}
                    characterMoves={effectiveMoves}
                    ordering={ordering}
                    editMode={editMode}
                    onAddMove={handleAddMoveToCategory}
                    onEditMove={handleEditMove}
                    onRemoveMove={handleRemoveMoveFromCategory}
                    onMoveItem={handleReorder}
                  />
                </div>
              ));
            })()}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddMoveModal
        isOpen={addModal.open}
        onClose={() => setAddModal({ open: false, targetCategoryId: null, moveId: null })}
        characterMoves={characterData.moves}
        targetCategoryId={addModal.targetCategoryId}
        currentTags={Object.fromEntries(
          Object.entries(effectiveMoves)
            .filter(([, m]) => m.tacticalTags?.length > 0)
            .map(([id, m]) => [id, m.tacticalTags])
        )}
        onSave={handleSaveMoveTags}
      />

      <SlotsPanel
        isOpen={slotsPanelOpen}
        onClose={() => setSlotsPanelOpen(false)}
        characterId={characterId}
        characterMoves={characterData.moves}
        onSlotsChange={(doc) => setSlotsDoc(doc)}
      />
    </div>
  );
};

export default TacticsPage;
