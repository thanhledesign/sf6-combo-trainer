import React from 'react';
import { SEASON, dataStatus } from '../data/season';

// Compact "Season 4" pill. With `meta` (a character's `_data`) it also reports
// whether that character's frame data has been synced for the current season.
export default function SeasonBadge({ meta, className = '' }) {
  if (!meta) {
    return (
      <span title={`Frame data targets ${SEASON.label} (${SEASON.capcomLabel}, since ${SEASON.since})`}
        className={`inline-flex items-center rounded-full border border-purple-500/40 bg-purple-600/20 px-2 py-0.5 text-[11px] font-semibold text-purple-300 whitespace-nowrap ${className}`}>
        {SEASON.label}
      </span>
    );
  }
  const s = dataStatus(meta);
  const when = s.at ? ` · synced ${new Date(s.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : '';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.current ? 'border-green-500/40 bg-green-600/15 text-green-300' : 'border-amber-500/40 bg-amber-600/15 text-amber-300'} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.current ? 'bg-green-400' : 'bg-amber-400'}`} />
      {s.text}{s.current ? when : ''}
    </span>
  );
}
