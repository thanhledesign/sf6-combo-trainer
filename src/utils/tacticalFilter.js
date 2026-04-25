// Tactical-tag filtering for the Tactics page.
// Spec: docs/_handoff-2026-04-24/04-TACTICAL-IA-SPEC.md §5.3

/**
 * Returns the moves from a character that have the given tag in their
 * tacticalTags array. Sorted with primary-tag matches first (per spec
 * §3.2), then by displayName. If `ordering` is provided and includes
 * an entry for `tagId`, it overrides the default sort.
 *
 * @param {Record<string, any>} characterMoves  character.moves dict
 * @param {string} tagId                         e.g. 'pokes'
 * @param {Record<string, string[]>=} ordering   optional per-category move-id order
 * @returns {Array<any>}                         array of move objects
 */
export function getMovesByTag(characterMoves, tagId, ordering) {
  if (!characterMoves || !tagId) return [];

  const matches = [];
  for (const move of Object.values(characterMoves)) {
    const tags = move?.tacticalTags;
    if (!Array.isArray(tags)) continue;
    const idx = tags.indexOf(tagId);
    if (idx === -1) continue;
    matches.push({ move, isPrimary: idx === 0 });
  }

  const explicit = ordering?.[tagId];
  if (explicit && explicit.length) {
    const orderMap = new Map(explicit.map((id, i) => [id, i]));
    matches.sort((a, b) => {
      const ai = orderMap.has(a.move.id) ? orderMap.get(a.move.id) : Infinity;
      const bi = orderMap.has(b.move.id) ? orderMap.get(b.move.id) : Infinity;
      if (ai !== bi) return ai - bi;
      // Fallback: primary first, then alpha
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return (a.move.displayName || '').localeCompare(b.move.displayName || '');
    });
  } else {
    matches.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return (a.move.displayName || '').localeCompare(b.move.displayName || '');
    });
  }

  return matches.map((m) => m.move);
}

/**
 * Convenience: get a tag count map for the whole character.
 * Used by the sub-nav to show "Pokes (3)" style counts.
 */
export function countMovesByTag(characterMoves) {
  const counts = {};
  if (!characterMoves) return counts;
  for (const move of Object.values(characterMoves)) {
    const tags = move?.tacticalTags;
    if (!Array.isArray(tags)) continue;
    for (const t of tags) counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}
