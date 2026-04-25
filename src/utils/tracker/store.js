// Persistence for the V01.31 win/loss tracker.
// All reads/writes go through platform/storage so the same code runs on
// web (localStorage) and Capacitor (Preferences) without edits.

import { storage } from '../platform';

const KEYS = {
  matches:         'sf6-tracker:matches',
  sessions:        'sf6-tracker:sessions',
  activeSessionId: 'sf6-tracker:active-session',
  customLossTags:  'sf6-tracker:custom-loss-tags',
  tiltSettings:    'sf6-tracker:tilt-settings',
};

const DEFAULT_TILT = { enabled: false, lossStreak: 3, sessionMins: 90, winRateDrop: 0.20 };

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const list = async (key) => (await storage.get(key)) ?? [];

export const trackerStore = {
  // ─── Sessions ──────────────────────────────────────────────────────

  /** @returns {Promise<import('./types.js').Session | null>} */
  async getActiveSession() {
    const id = await storage.get(KEYS.activeSessionId);
    if (!id) return null;
    const sessions = await list(KEYS.sessions);
    return sessions.find((s) => s.id === id) ?? null;
  },

  /**
   * @param {Partial<import('./types.js').Session>} [opts]
   * @returns {Promise<import('./types.js').Session>}
   */
  async startSession({ setLength = 'FT2', roundsPerGame = 2, customSetLength, intent } = {}) {
    const session = {
      id: newId(),
      startedAt: Date.now(),
      setLength,
      roundsPerGame,
      ...(customSetLength != null && { customSetLength }),
      ...(intent && { intent }),
    };
    const sessions = await list(KEYS.sessions);
    sessions.push(session);
    await storage.set(KEYS.sessions, sessions);
    await storage.set(KEYS.activeSessionId, session.id);
    return session;
  },

  /** @returns {Promise<import('./types.js').Session | null>} */
  async endSession() {
    const id = await storage.get(KEYS.activeSessionId);
    if (!id) return null;
    const sessions = await list(KEYS.sessions);
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx >= 0) {
      sessions[idx] = { ...sessions[idx], endedAt: Date.now() };
      await storage.set(KEYS.sessions, sessions);
    }
    await storage.remove(KEYS.activeSessionId);
    return idx >= 0 ? sessions[idx] : null;
  },

  /** @param {string} id @param {Partial<import('./types.js').Session>} patch */
  async updateSession(id, patch) {
    const sessions = await list(KEYS.sessions);
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx < 0) return null;
    sessions[idx] = { ...sessions[idx], ...patch, id };
    await storage.set(KEYS.sessions, sessions);
    return sessions[idx];
  },

  /** @returns {Promise<import('./types.js').Session[]>} */
  async getAllSessions() {
    return list(KEYS.sessions);
  },

  // ─── Matches ──────────────────────────────────────────────────────

  /**
   * Records a match. Auto-starts a session with defaults if none active —
   * supports the quick-entry "tap +W mid-set without ceremony" flow.
   * @param {Partial<import('./types.js').Match> & {result: 'W'|'L'}} input
   * @returns {Promise<import('./types.js').Match>}
   */
  async addMatch({ result, yourCharacter, opponentCharacter, notes, lossTags }) {
    let session = await this.getActiveSession();
    if (!session) session = await this.startSession();
    const match = {
      id: newId(),
      sessionId: session.id,
      timestamp: Date.now(),
      result,
      ...(yourCharacter && { yourCharacter }),
      ...(opponentCharacter && { opponentCharacter }),
      ...(notes && { notes }),
      ...(lossTags && lossTags.length > 0 && { lossTags }),
    };
    const matches = await list(KEYS.matches);
    matches.push(match);
    await storage.set(KEYS.matches, matches);
    return match;
  },

  /** @param {string} id @param {Partial<import('./types.js').Match>} patch */
  async updateMatch(id, patch) {
    const matches = await list(KEYS.matches);
    const idx = matches.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    matches[idx] = { ...matches[idx], ...patch, id };
    await storage.set(KEYS.matches, matches);
    return matches[idx];
  },

  /** @param {string} id */
  async deleteMatch(id) {
    const matches = await list(KEYS.matches);
    await storage.set(KEYS.matches, matches.filter((m) => m.id !== id));
  },

  /** @returns {Promise<import('./types.js').Match[]>} */
  async getAllMatches() {
    return list(KEYS.matches);
  },

  /** @param {string} sessionId */
  async getMatchesForSession(sessionId) {
    const matches = await this.getAllMatches();
    return matches.filter((m) => m.sessionId === sessionId);
  },

  // ─── Tilt settings ─────────────────────────────────────────────────

  /** @returns {Promise<import('./types.js').TiltSettings>} */
  async getTiltSettings() {
    return (await storage.get(KEYS.tiltSettings)) ?? DEFAULT_TILT;
  },

  /** @param {import('./types.js').TiltSettings} settings */
  async setTiltSettings(settings) {
    await storage.set(KEYS.tiltSettings, settings);
  },

  // ─── Custom loss tags ──────────────────────────────────────────────

  /** @returns {Promise<import('./types.js').LossTag[]>} */
  async getCustomLossTags() {
    return list(KEYS.customLossTags);
  },

  /** @param {import('./types.js').LossTag} tag */
  async addCustomLossTag(tag) {
    const tags = await this.getCustomLossTags();
    if (tags.some((t) => t.id === tag.id)) return;
    tags.push(tag);
    await storage.set(KEYS.customLossTags, tags);
  },
};
