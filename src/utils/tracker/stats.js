// Aggregations for the V01.31 tracker. All read-only — no side effects.

import { trackerStore } from './store';

const tally = (matches) => {
  const wins = matches.filter((m) => m.result === 'W').length;
  const losses = matches.filter((m) => m.result === 'L').length;
  const total = wins + losses;
  return { wins, losses, total, winRate: total ? wins / total : 0 };
};

/**
 * Win rate for the active session.
 */
export async function activeSessionStats() {
  const session = await trackerStore.getActiveSession();
  if (!session) return { session: null, ...tally([]) };
  const matches = await trackerStore.getMatchesForSession(session.id);
  return { session, ...tally(matches) };
}

/**
 * Win rate per character you played as.
 * @returns {Promise<Array<{yourCharacter:string, wins:number, losses:number, total:number, winRate:number}>>}
 */
export async function winRateByYourCharacter() {
  const matches = await trackerStore.getAllMatches();
  const groups = {};
  for (const m of matches) {
    if (!m.yourCharacter) continue;
    (groups[m.yourCharacter] ??= []).push(m);
  }
  return Object.entries(groups).map(([yourCharacter, ms]) => ({
    yourCharacter,
    ...tally(ms),
  }));
}

/**
 * Per-matchup win rate (your character vs opponent character).
 * Powers the "problem matchups" view + Trainer bridge.
 * @param {{yourCharacter?: string}} [filter]
 */
export async function winRateByMatchup({ yourCharacter } = {}) {
  const matches = await trackerStore.getAllMatches();
  const groups = {};
  for (const m of matches) {
    if (!m.yourCharacter || !m.opponentCharacter) continue;
    if (yourCharacter && m.yourCharacter !== yourCharacter) continue;
    const key = `${m.yourCharacter}__${m.opponentCharacter}`;
    (groups[key] ??= { yourCharacter: m.yourCharacter, opponentCharacter: m.opponentCharacter, matches: [] }).matches.push(m);
  }
  return Object.values(groups).map(({ matches: ms, ...rest }) => ({
    ...rest,
    ...tally(ms),
  }));
}

/**
 * Top loss tags ("your top leaks"). Defaults to all-time; pass `sinceTimestamp`
 * for "this week" / "last 7 days" style queries.
 * @param {{limit?: number, sinceTimestamp?: number}} [opts]
 */
export async function topLossTags({ limit = 5, sinceTimestamp } = {}) {
  const matches = await trackerStore.getAllMatches();
  const counts = {};
  for (const m of matches) {
    if (m.result !== 'L' || !m.lossTags) continue;
    if (sinceTimestamp != null && m.timestamp < sinceTimestamp) continue;
    for (const id of m.lossTags) {
      counts[id] = (counts[id] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Current loss streak in the active session (latest matches first, count Ls
 * until the first W). Powers the tilt meter "3 losses in a row" trigger.
 */
export async function currentLossStreak() {
  const session = await trackerStore.getActiveSession();
  if (!session) return 0;
  const matches = (await trackerStore.getMatchesForSession(session.id))
    .sort((a, b) => b.timestamp - a.timestamp);
  let streak = 0;
  for (const m of matches) {
    if (m.result !== 'L') break;
    streak++;
  }
  return streak;
}

/**
 * Tilt-meter check. Returns the *first* trigger that's firing, or null.
 * Pure function over current state — no side effects, no notifications.
 * The UI decides whether/how to surface the result, including manual triggers.
 * @returns {Promise<null | {reason: 'lossStreak'|'sessionLength'|'winRateDrop', detail: any}>}
 */
export async function tiltCheck() {
  const settings = await trackerStore.getTiltSettings();
  if (!settings.enabled) return null;

  const streak = await currentLossStreak();
  if (streak >= settings.lossStreak) {
    return { reason: 'lossStreak', detail: { streak } };
  }

  const session = await trackerStore.getActiveSession();
  if (session) {
    const minsElapsed = (Date.now() - session.startedAt) / 60000;
    if (minsElapsed >= settings.sessionMins) {
      return { reason: 'sessionLength', detail: { minsElapsed: Math.round(minsElapsed) } };
    }

    // Win rate drop: compare first half of session vs current
    const matches = (await trackerStore.getMatchesForSession(session.id))
      .sort((a, b) => a.timestamp - b.timestamp);
    if (matches.length >= 6) {
      const half = Math.floor(matches.length / 2);
      const earlyRate = tally(matches.slice(0, half)).winRate;
      const overallRate = tally(matches).winRate;
      if (earlyRate - overallRate >= settings.winRateDrop) {
        return {
          reason: 'winRateDrop',
          detail: { earlyRate, overallRate, drop: earlyRate - overallRate },
        };
      }
    }
  }

  return null;
}
