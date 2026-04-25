// Type definitions for the V01.31 win/loss tracker.
// JS-only repo; jsdoc gives IDE autocomplete via the TS language server.

/**
 * @typedef {object} Match
 * @property {string} id  - uuid
 * @property {string} sessionId
 * @property {number} timestamp  - unix ms at creation
 * @property {'W'|'L'} result
 * @property {string} [yourCharacter]      - character id, e.g. 'ken'
 * @property {string} [opponentCharacter]  - character id
 * @property {string} [notes]              - free text
 * @property {string[]} [lossTags]         - tag ids; only meaningful when result === 'L'
 */

/**
 * @typedef {object} SessionIntent
 * @property {string} goal               - e.g. "punish DI on reaction"
 * @property {1|2|3|4|5} [selfRating]    - filled in after the set
 */

/**
 * @typedef {object} Session
 * @property {string} id
 * @property {number} startedAt          - unix ms
 * @property {number} [endedAt]          - unix ms; undefined while active
 * @property {'FT1'|'FT2'|'FT3'|'custom'} setLength
 * @property {number} [customSetLength]
 * @property {number} roundsPerGame      - usually 2 or 3
 * @property {SessionIntent} [intent]
 */

/**
 * @typedef {object} TiltSettings
 * @property {boolean} enabled
 * @property {number} lossStreak    - matches lost in a row to fire (default 3)
 * @property {number} sessionMins   - session length in minutes to fire (default 90)
 * @property {number} winRateDrop   - in-session win rate drop fraction (default 0.20)
 */

/**
 * @typedef {object} LossTag
 * @property {string} id     - kebab-case
 * @property {string} label  - human-readable
 */

export {};
