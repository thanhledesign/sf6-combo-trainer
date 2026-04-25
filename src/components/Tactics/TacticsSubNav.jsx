import { useEffect, useRef } from 'react';
import { TACTICAL_CATEGORIES, DIVIDER_AFTER_ORDER } from '../../data/tacticalCategories';

// Sticky sub-nav. Mobile: horizontal scroll chips with auto-scroll-to-active.
// Desktop: vertical left rail with active highlighting. Spec §6.2-§6.4.
// Visual gap between order 4 and 5 implements the "toolkit / situational" divider (§6.1).

const TacticsSubNav = ({ activeId, counts, onSelect, variant = 'mobile' }) => {
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
          {TACTICAL_CATEGORIES.map((cat) => {
            const count = counts?.[cat.id] ?? 0;
            const isActive = cat.id === activeId;
            const showDivider = cat.order === DIVIDER_AFTER_ORDER + 1;
            return (
              <li key={cat.id}>
                {showDivider && (
                  <hr className="border-gray-700 my-2" aria-hidden />
                )}
                <button
                  onClick={() => onSelect?.(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between gap-2 ${
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
        {TACTICAL_CATEGORIES.map((cat) => {
          const count = counts?.[cat.id] ?? 0;
          const isActive = cat.id === activeId;
          const showDividerGap = cat.order === DIVIDER_AFTER_ORDER + 1;
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
