import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TACTICAL_CATEGORIES, DIVIDER_AFTER_ORDER } from '../../data/tacticalCategories';
import { countMovesByTag } from '../../utils/tacticalFilter';
import TacticsCategorySection from './TacticsCategorySection';
import TacticsSubNav from './TacticsSubNav';

// Full 9-section Tactics page. Spec §6.
// Routes:
//   /character/:characterId/tactics
//   /character/:characterId/tactics/:categoryId   (deep-link to scroll target)

const TacticsPage = ({ characterMap }) => {
  const { characterId, categoryId } = useParams();
  const navigate = useNavigate();
  const characterData = characterMap?.[characterId];

  const [activeId, setActiveId] = useState(categoryId || TACTICAL_CATEGORIES[0].id);

  // Counts per category — recompute when character changes
  const counts = useMemo(
    () => countMovesByTag(characterData?.moves),
    [characterData],
  );

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
      // Defer to next frame so layout is stable
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }));
      didInitialScroll.current = true;
    }
  }, [characterData, categoryId]);

  // IntersectionObserver to highlight the section currently in view
  const sectionsContainerRef = useRef(null);
  useEffect(() => {
    if (!characterData) return;
    const sections = Array.from(
      document.querySelectorAll('[data-tactics-section]'),
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry whose top is closest to the viewport's "active line"
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.getAttribute('data-tactics-section');
          if (id) setActiveId(id);
        }
      },
      {
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0,
      },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [characterData]);

  const handleSubNavSelect = (id) => {
    setActiveId(id);
    const el = document.getElementById(`tactics-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Update URL without full re-render
    navigate(`/character/${characterId}/tactics/${id}`, { replace: true });
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
      {/* Mobile / tablet sub-nav */}
      <TacticsSubNav
        activeId={activeId}
        counts={counts}
        onSelect={handleSubNavSelect}
        variant="mobile"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8 lg:flex lg:gap-8">
        {/* Desktop left rail */}
        <TacticsSubNav
          activeId={activeId}
          counts={counts}
          onSelect={handleSubNavSelect}
          variant="desktop"
        />

        {/* Main content */}
        <main ref={sectionsContainerRef} className="flex-1 min-w-0">
          <header className="mb-6">
            <p className="text-xs uppercase tracking-wide text-purple-400 font-semibold">
              Tactical Guide
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              {characterData.character?.displayName || characterData.character?.name || characterId}
            </h1>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl">
              The 3-6 moves that matter most in each tactical situation. Curated, not exhaustive — see <button onClick={() => navigate(`/browse/${characterId}`)} className="text-purple-400 hover:text-purple-300 underline">Browse</button> for the full movelist.
            </p>
          </header>

          <div className="flex flex-col gap-10 md:gap-12">
            {TACTICAL_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                {cat.order === DIVIDER_AFTER_ORDER + 1 && (
                  <hr className="hidden lg:block border-gray-800 mb-12" aria-hidden />
                )}
                <TacticsCategorySection
                  category={cat}
                  characterMoves={characterData.moves}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TacticsPage;
