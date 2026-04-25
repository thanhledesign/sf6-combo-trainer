import { useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { TACTICAL_CATEGORIES, DIVIDER_AFTER_ORDER, TACTICAL_CATEGORY_BY_ID } from '../../data/tacticalCategories';

// Sticky sub-nav. Mobile: horizontal scroll chips with auto-scroll-to-active.
// Desktop: vertical left rail with active highlighting. Spec §6.2-§6.4.
// Visual gap between order 4 and 5 implements the "toolkit / situational" divider (§6.1).
// Custom category order suppresses the divider (it only makes sense for the
// default 1-4 / 5-9 grouping).

const resolveOrder = (customOrder) => {
  if (!customOrder || customOrder.length === 0) return TACTICAL_CATEGORIES;
  const seen = new Set();
  const out = [];
  for (const id of customOrder) {
    const cat = TACTICAL_CATEGORY_BY_ID[id];
    if (cat && !seen.has(id)) { out.push(cat); seen.add(id); }
  }
  // Append any categories missing from the custom order at the end
  for (const cat of TACTICAL_CATEGORIES) {
    if (!seen.has(cat.id)) out.push(cat);
  }
  return out;
};

const TacticsSubNav = ({ activeId, counts, onSelect, variant = 'mobile', editMode = false, categoryOrder = null, onReorderCategory = null }) => {
  const isCustomOrder = !!(categoryOrder && categoryOrder.length > 0);
  const categories = resolveOrder(categoryOrder);
  const railRef = useRef(null);
  const activeChipRef = useRef(null);

  // Mobile: keep the active chip visible by scrolling it into view
  useEffect(() => {
    if (variant !== 'mobile' || !activeChipRef.current) return;
    activeChipRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeId, variant]);

  if (variant === 'desktop') {
    return (
      <nav
        aria-label="Tactical categories"
        className="sticky top-24 self-start w-60 shrink-0 hidden lg:block"
      >
        <ol className="flex flex-col gap-1">
          {categories.map((cat, idx) => {
            const count = counts?.[cat.id] ?? 0;
            const isActive = cat.id === activeId;
            const showDivider = !isCustomOrder && cat.order === DIVIDER_AFTER_ORDER + 1;
            return (
              <li key={cat.id}>
                {showDivider && (
                  <hr className="border-gray-700 my-2" aria-hidden />
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelect?.(cat.id)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-purple-700 text-purple-100' : 'bg-gray-800 text-gray-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                  {editMode && onReorderCategory && (
                    <div className="flex flex-col">
                      <button
                        onClick={() => onReorderCategory(cat.id, 'up')}
                        disabled={idx === 0}
                        aria-label="Move category up"
                        className={`p-0.5 rounded ${idx === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onReorderCategory(cat.id, 'down')}
                        disabled={idx === categories.length - 1}
                        aria-label="Move category down"
                        className={`p-0.5 rounded ${idx === categories.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  // Mobile / tablet: horizontal scroll chips
  return (
    <nav
      aria-label="Tactical categories"
      className="lg:hidden sticky top-16 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800"
    >
      <ol
        ref={railRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3"
      >
        {categories.map((cat) => {
          const count = counts?.[cat.id] ?? 0;
          const isActive = cat.id === activeId;
          const showDividerGap = !isCustomOrder && cat.order === DIVIDER_AFTER_ORDER + 1;
          return (
            <li
              key={cat.id}
              className={showDividerGap ? 'pl-3 border-l border-gray-700' : ''}
            >
              <button
                ref={isActive ? activeChipRef : null}
                onClick={() => onSelect?.(cat.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat.label}
                <span className="ml-1.5 text-xs opacity-75">{count}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default TacticsSubNav;
