import React from 'react';
import { parseNormalInput } from '../../data/buttonInput';

// Official SF6 button / direction art (exported from Figma) in public/buttons/.
export default function ButtonInput({ input, compact = false }) {
  const parsed = parseNormalInput(input);
  if (!parsed) return null;
  const h = compact ? 'h-9' : 'h-14';
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1 bg-gradient-to-br from-purple-900/60 to-purple-950/70">
      <div className="flex items-center justify-center gap-2">
        {parsed.tokens.map((t, i) => (
          <img
            key={i}
            src={t.type === 'arrow' ? `/buttons/arrow-${t.value}.png` : `/buttons/${t.value.toLowerCase()}.png`}
            alt={t.type === 'arrow' ? `direction ${t.value}` : t.value}
            className={`${h} w-auto object-contain`}
            draggable={false}
          />
        ))}
      </div>
      {parsed.label && (
        <span className="text-[10px] uppercase tracking-widest text-purple-300/70">{parsed.label}</span>
      )}
    </div>
  );
}
