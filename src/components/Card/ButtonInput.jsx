import React from 'react';
import { parseInput } from '../../data/buttonInput';

// Official SF6 button / direction art (exported from Figma) in public/buttons/.
// Shown in the media slot of every move card that has a parseable command.
export default function ButtonInput({ input, compact = false }) {
  const parsed = parseInput(input);
  if (!parsed) return null;
  const n = parsed.tokens.filter((t) => t.type !== 'plus' && t.type !== 'slash').length;
  const h = n > 9 ? 'h-6' : n > 6 ? 'h-8' : compact || n > 4 ? 'h-9' : 'h-14';
  const badge = `${h} aspect-square rounded-full border-2 border-purple-300/60 bg-purple-950/70 text-purple-100 font-bold flex items-center justify-center`;
  const note = parsed.label || parsed.context;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1 px-2 bg-gradient-to-br from-purple-900/60 to-purple-950/70">
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        {parsed.tokens.map((t, i) => {
          if (t.type === 'plus') return <span key={i} className="text-purple-200/80 font-bold px-0.5">+</span>;
          if (t.type === 'slash') return <span key={i} className="text-purple-200/60 px-0.5">/</span>;
          if (t.type === 'neutral') return <span key={i} className={`${h} aspect-square flex items-center justify-center`} aria-label="neutral"><i className="block w-1/4 aspect-square rounded-full bg-purple-200/70" /></span>;
          if (t.type === 'generic') return <span key={i} className={`${badge} text-[1.1rem]`} aria-label={t.value === 'P' ? 'any punch' : 'any kick'}>{t.value}</span>;
          return (
            <img
              key={i}
              src={t.type === 'arrow' ? `/buttons/arrow-${t.value}.png` : `/buttons/${t.value.toLowerCase()}.png`}
              alt={t.type === 'arrow' ? `direction ${t.value}` : t.value}
              className={`${h} w-auto object-contain`}
              draggable={false}
            />
          );
        })}
      </div>
      {note && <span className="text-[10px] uppercase tracking-wider text-purple-300/70 text-center leading-tight line-clamp-2">{note}</span>}
    </div>
  );
}
