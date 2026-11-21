import { charThumb } from '../data/charThumb';

// Shared avatar that renders either a thumbnail PNG (when known) or a
// colored fallback circle with the character's initial. Used by the
// character selector, character cards, and the head-to-head set tracker.



// Stable color hash so each new character gets a consistent fallback color.
const PALETTE = [
  ['#7c3aed', '#4f46e5'],  // purple → indigo (matches brand)
  ['#0891b2', '#0e7490'],  // cyan
  ['#16a34a', '#15803d'],  // green
  ['#ca8a04', '#a16207'],  // amber
  ['#dc2626', '#991b1b'],  // red
  ['#db2777', '#9d174d'],  // pink
  ['#475569', '#334155'],  // slate
];
const colorFor = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};


const CharacterAvatar = ({ characterId, name, size = 'md', className = '', ...rest }) => {
  const sizeMap = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };
  const sizeClass = sizeMap[size] || sizeMap.md;
  const thumb = charThumb(characterId);

  if (thumb) {
    return (
      <img
        src={thumb}
        alt={name || characterId}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        {...rest}
      />
    );
  }

  const [from, to] = colorFor(characterId || 'x');
  const initial = (name || characterId || '?').charAt(0).toUpperCase();
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shadow-md ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      {...rest}
    >
      {initial}
    </div>
  );
};

export default CharacterAvatar;
