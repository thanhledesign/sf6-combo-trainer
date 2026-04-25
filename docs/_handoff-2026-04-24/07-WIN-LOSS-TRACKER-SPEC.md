# 07 — Win/Loss Tracker Spec (V01.31)

Killer-app sticky feature for the SF6 Combo Trainer. Active-use during ranked sessions, integrates with the opponent-first IA via the Trainer bridge.

**Locked decisions (Thanh, 2026-04-24):**
- Scope to **V01.31** — lands right after T3 (PWA) and T4 (iOS/Android readiness). Built on the storage abstraction from T4 day one.
- Phase 2 included in first release (matchup intel + Trainer bridge are the stickiness)
- Tilt meter is **opt-in**, with manual triggerability
- **Quick-entry default**, advanced/structured mode behind a "log details" button

---

## Phase 1 — MVP (must-ship for V01.31)

### Quick-entry counter
- One-tap **+W** / **+L** during a set. No modal, no friction. Big tap targets, optimised for landscape phone-in-hand.
- Each tap creates a `Match` record with timestamp.
- Visible W-L for current session at all times.

### Structured entry (optional, behind "log details")
Per match, optionally:
- Your character (defaults to currently-selected character in nav)
- Opponent character (picker)
- Result (auto from W/L tap; editable)
- Notes (free text — "what beat me / what worked")

### Game conditions (per session, set once)
- **Set length**: FT1, FT2, FT3, custom
- **Rounds per game** (default 2/3, optional override)
- These attach to all matches in the session.

### Session view
- List of matches in current session, scrollable, inline edit
- Stats header: today's W-L, session win rate

### Persistent stats
- Overall W-L per character you play
- All-time W-L total

---

## Phase 2 — Matchup intelligence (must-ship for V01.31)

### Per-matchup win rate
- Aggregates: "Ken vs Gief: 32% (8/25)"
- Sortable table — surfaces problem matchups
- Filtered by your character

### Trainer bridge (the killer integration)
- From any match entry, one-tap **"Study this matchup"** → jumps to that opponent's moves in `/browse/{opponent}` with a context banner ("Reviewing what beat you")
- From the loss tag for "lost to Terry OD rush" → deep-link straight to that move card

### Structured loss tags
- Checklist (multi-select) of common failure modes:
  - didn't anti-air
  - lost neutral to DI
  - whiff punished too much
  - dropped combo
  - threw out raw DP
  - couldn't break throw
  - poor wakeup defense
  - ran out of meter at key moment
  - tilted / made bad reads
- Aggregates into "Your top leaks this week" view
- User-extensible: add custom tags

### Pre-set intent (active-learning hook)
- Before a set: pick **one thing** to practice ("punish DI on reaction")
- After the set: 1-5 self-rating on how well you executed it
- Logs alongside session — turns ranked play into directed practice

---

## Phase 3 — Tilt management (opt-in, must-ship V01.31)

### Triggers (opt-in toggle in settings; **always-manually-triggerable** via tilt-meter button)
- 3 losses in a row
- Win rate drop of >20% in current session
- Session length >90 min with recent losses

### Break prompt
- Dismissable modal: "Take a 10-min break?"
- Tone: encouraging, not scolding ("You played well an hour ago — let's reset.")
- 10-min timer with Skip / Done buttons

### Heatmap (Phase 3 stretch — defer if needed)
- Play times of day vs. win rate. Surfaces "late-night tilt" patterns.

---

## Phase 4 — Social/progress (post-V01.31, separate version)

- **MR tracker**: start-of-session MR → current MR delta
- **Rival H2H**: same CFN ID across sessions → head-to-head tally
- **Per-matchup notepad**: persistent notes per character pair
- **Export/share**: copy session summary as text

---

## Out of scope (do not build)

- CFN API integration (fragile, ToS-gray)
- Leaderboards / social ranking (scope creep, moderation)
- Video / replay attachment (PWA storage limits)
- Cloud sync (until/unless multi-device demand emerges)

---

## Data model (sketch — finalise during impl)

```ts
type Match = {
  id: string                 // uuid
  sessionId: string
  timestamp: number
  result: 'W' | 'L'
  yourCharacter?: CharacterId
  opponentCharacter?: CharacterId
  notes?: string
  lossTags?: string[]        // ['didnt-anti-air', 'lost-neutral-to-di']
}

type Session = {
  id: string
  startedAt: number
  endedAt?: number
  setLength: 'FT1' | 'FT2' | 'FT3' | 'custom'
  customSetLength?: number
  roundsPerGame: 2 | 3 | number
  intent?: { goal: string; selfRating?: 1|2|3|4|5 }
}

type TiltSettings = {
  enabled: boolean
  thresholdLossStreak: number    // default 3
  thresholdSessionMins: number   // default 90
  thresholdWinRateDrop: number   // default 0.20
}
```

All persistence goes through `src/utils/platform/storage.js` (created in T4). No direct `localStorage` calls.

---

## UI surfaces (sketch)

- **New nav entry**: "Tracker" (mobile + desktop)
- **`/tracker`** — main view (session counter + match list)
- **`/tracker/stats`** — matchup intel + per-character stats
- **`/tracker/settings`** — tilt config, custom loss tags
- **Quick-access FAB** on `/browse/*` and `/punish/*` for "+W / +L" mid-session

Wireframes pending from Thanh in Figma (file `Bc7305TyPGELiIE4rmwVJe`). Do not invent layout — wait on wireframes before implementing UI.

---

## Implementation phasing within V01.31

1. **Branch**: `feat/win-loss-tracker`
2. Storage layer (built on T4 abstractions) + types
3. Quick-entry counter + session model (Phase 1)
4. Match log + structured entry (Phase 1)
5. Per-matchup stats + trainer bridge (Phase 2)
6. Loss tags + pre-set intent (Phase 2)
7. Opt-in tilt meter + manual trigger (Phase 3 core)
8. Heatmap (Phase 3 stretch, defer if behind schedule)

**Gating**: Figma wireframes from Thanh before step 3 (UI work).

**Done when**: Phase 1+2 ship, Phase 3 core (tilt opt-in + manual trigger) ships, all data persists across reload, no direct browser-API calls outside `src/utils/platform/`.
