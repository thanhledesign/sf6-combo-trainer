// Single source of truth for which game season the app's frame data targets.
// Keep in sync with SEASON in scripts/sync/scrape-capcom.mjs.
// Capcom brands these "Year N"; players say "Season N". Season 4 = Year 4,
// launched 2026-08-03 (Yasmine + roster-wide balance pass).
export const SEASON = {
  number: 4,
  label: 'Season 4',
  capcomLabel: 'Year 4',
  since: 'Aug 3, 2026',
};

// Per-character data status, from the `season` stamp the scraper writes.
// Files scraped before the stamp existed (or before Season 4) read as stale.
export function dataStatus(meta) {
  const n = meta?.season ?? null;
  if (n === SEASON.number) return { current: true, text: `${SEASON.label} frame data`, at: meta.scrapedAt };
  return { current: false, text: n ? `Season ${n} data — Season ${SEASON.number} sync pending` : `Pre-Season ${SEASON.number} data — sync pending`, at: meta?.scrapedAt || null };
}
