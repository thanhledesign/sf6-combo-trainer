# SF6 Combo Trainer — Sitemap

Reference sitemap for design/IA work. **Generated 2026-04-25, V01.32.**

Companion artifacts:
- [`sitemap.html`](sitemap.html) — visual sitemap with screenshots (print to PDF for 8.5x11)
- Run `npm run sitemap` to regenerate screenshots from the live site

Live: https://sf6-combo-trainer.vercel.app · Password: `shoryuken`

---

## 1. Tree

```
[ Password Gate ]  (sessionStorage: sf6-trainer-password-ok)
        │
        ▼
[ Global Nav ]  ← present on every page below
   │ Logo · Characters · Tactics · Tracker · Punish · Search · Character thumbnail
   │
   ├── /                        Landing — character grid                  → CharacterCards
   ├── /characters              same as /
   │
   ├── /browse/:characterId     Movelist by 4 default categories          → MoveBrowser
   │       └── (MoveCard flips between Player / Opponent perspective)
   │
   ├── /character/:id/tactics                  9-section Tactical Guide   → TacticsPage
   │       └── /tactics/:categoryId            deep-link scroll target
   │
   ├── /tracker                                Win/Loss tracker (V01.32)  → TrackerPage
   │       └── /tracker/stats                  Per-char + matchup intel   → StatsPage
   │
   ├── /punish/:characterId     Frame-disadvantage punish lookup          → PunishCalculator
   │
   └── /search                  Cross-character search                    → SearchResults
```

**Modals (overlay state, not routes)** — accessed from various pages:

```
CharacterSelectorModal  ← top-right thumbnail (any page)
AddMoveModal            ← Tactics edit mode → "+ Add move"
SlotsPanel              ← Tactics page → gear icon
AdvancedEntryModal      ← Tracker → "Log details" or per-match edit
SettingsPanel           ← Tracker → gear icon (tilt thresholds, defaults)
TiltModal               ← Tracker → coffee icon (manual) or auto-trigger
```

---

## 2. Per-page detail

### 2.1 Landing — `/`, `/characters`

**Purpose:** Pick a character to study.
**Component:** [`CharacterCards.jsx`](../src/components/CharacterCards.jsx)
**Live:** https://sf6-combo-trainer.vercel.app/

- Grid of all 7 character thumbnails
- Tap/click → navigates to `/browse/:characterId`

### 2.2 Browse — `/browse/:characterId`

**Purpose:** Full movelist, organized by 4 IA categories: Neutral / Offensive / Combo / Corner.
**Component:** [`MoveBrowser.jsx`](../src/components/Browse/MoveBrowser.jsx)
**Live:** https://sf6-combo-trainer.vercel.app/browse/ken

- Sticky in-page sub-nav for the 4 categories
- Each move rendered as a flippable `MoveCard`
- MoveCard front: video, your-perspective tactical use, frame data badges, damage
- MoveCard back: opponent-perspective, on-block punishes, what-to-press

### 2.3 Tactical Guide — `/character/:id/tactics`

**Purpose:** Curated 9-section tactical view (the move-by-situation lens).
**Component:** [`TacticsPage.jsx`](../src/components/Tactics/TacticsPage.jsx)
**Live:** https://sf6-combo-trainer.vercel.app/character/ken/tactics
**Spec:** [`docs/_handoff-2026-04-24/04-TACTICAL-IA-SPEC.md`](_handoff-2026-04-24/04-TACTICAL-IA-SPEC.md)

**The 9 categories** (custom-orderable per slot):
1. Pokes
2. Anti-Airs
3. +OB (Plus on Block)
4. Super Arts
5. Meaties · 6. Burnout Harassment · 7. DRC Combo · 8. Super Arts Combo · 9. Unique Mechanics

**States:**
- **View (default):** read-only, factory tags from annotations
- **Edit mode:** per-card ↑↓ reorder, X to remove, ✏ to edit tags, "+ Add" tile per section. Auto-saves to active slot.
- **Empty state (non-Ken or no slot):** "Build your own" CTA card replaces section grid (sections still visible at 50% for structure preview)

**Sub-nav:** Mobile = horizontal chip scroll · Desktop = vertical left rail with active highlighting via IntersectionObserver.

**Slot system** (5 slots per character): create from factory snapshot or empty, rename, switch active, export JSON, import JSON. Persisted via `platform/storage`.

**Deep-link:** `/character/ken/tactics/pokes` scrolls to that section on load.

### 2.4 Tracker — `/tracker` (V01.32 killer feature)

**Purpose:** In-the-moment win/loss logging during ranked sessions.
**Component:** [`TrackerPage.jsx`](../src/components/Tracker/TrackerPage.jsx)
**Live:** https://sf6-combo-trainer.vercel.app/tracker
**Spec:** [`docs/_handoff-2026-04-24/07-WIN-LOSS-TRACKER-SPEC.md`](_handoff-2026-04-24/07-WIN-LOSS-TRACKER-SPEC.md)

**Sections (top to bottom):**
1. Header — session age + setLength + 3 icon buttons (Tilt manual / Stats / Settings)
2. Tilt banner (when auto-detected and tilt-meter enabled)
3. 3-stat summary — Wins / Losses / WinRate
4. Loss-streak warning (≥3 in a row)
5. **+W / +L big tap targets** (the centerpiece)
6. "+ Log details" button → opens advanced modal
7. Match list — newest first, per-row: result badge, your char vs opp char, time, **Study** Trainer-bridge link, edit, delete
8. End session link

**Auto-behaviors:**
- First +W/+L tap auto-starts a session
- Session config (FT2, 2 rounds) is the default, customizable in Settings
- Tilt detection runs on every refresh (when enabled)

### 2.5 Tracker Stats — `/tracker/stats`

**Component:** [`StatsPage.jsx`](../src/components/Tracker/StatsPage.jsx)
**Live:** https://sf6-combo-trainer.vercel.app/tracker/stats

- **Per-your-character** win rates table
- **Matchup table** — sorted by problem matchups first, "Problem" badge for ≥3 games <40%, **Trainer bridge** to opponent's `/browse`
- **Top leaks** — last 7 days, aggregated loss-tag counts

### 2.6 Punish Calculator — `/punish/:characterId`

**Purpose:** "Opponent's move was -X on block — what can I press?"
**Component:** [`PunishCalculator.jsx`](../src/components/Punish/PunishCalculator.jsx)
**Live:** https://sf6-combo-trainer.vercel.app/punish/ken

- Input: frame disadvantage value (or pick from a known-move list)
- Output: your character's moves whose startup ≤ that value, sorted by damage

### 2.7 Search — `/search`

**Component:** [`SearchResults.jsx`](../src/components/Search/SearchResults.jsx)
**Live:** https://sf6-combo-trainer.vercel.app/search

- Cross-character search by move name, notation, or tactical description
- Results grouped by character

---

## 3. Modal inventory

| Modal | Triggered from | Purpose |
|---|---|---|
| `PasswordGate` | App load (when env var set) | Beta password barrier |
| `CharacterSelectorModal` | Top-right thumbnail (every page) | Switch active character |
| `AddMoveModal` | Tactics edit → "+ Add move" tile or pencil icon | Pick a move, set tags, validate (+OB / Super Arts hard checks) |
| `SlotsPanel` | Tactics → gear icon | Slot manager: rename, switch, delete, export JSON, import JSON |
| `AdvancedEntryModal` | Tracker → "Log details" or per-match edit | Full match detail entry: char + opp + notes + loss tags |
| `SettingsPanel` | Tracker → gear icon | Tilt thresholds (opt-in), set defaults |
| `TiltModal` | Tracker → coffee icon (manual) or auto-trigger | 10-min break timer with reason-specific message |

---

## 4. State / persistence model

| State | Where | Lifecycle |
|---|---|---|
| Auth (password) | `sessionStorage[sf6-trainer-password-ok]` | Tab close → forgets |
| Selected character | `App.jsx` React state | In-memory, page reload forgets |
| Tactics slots (per character) | `localStorage[sf6-tactics:<charId>]` | Persistent |
| Tracker matches/sessions | `localStorage[sf6-tracker:matches/sessions/...]` | Persistent |
| Tilt settings | `localStorage[sf6-tracker:tilt-settings]` | Persistent |

All persistent storage goes through `src/utils/platform/storage.js` — Capacitor-ready.

---

## 5. Cross-cutting features

- **Trainer bridge** — match logged in tracker has opponent → "Study" → jumps to that opponent's `/browse`. Closes the loop between "what beat me" and "what to learn."
- **Edit mode** (Tactics) — toggleable; reveals per-card controls and autosave to active slot
- **Custom slot data** export/import — JSON file download/upload; per-character; share configurations
- **Mobile vs Desktop** — different sub-nav layouts in Tactics (horizontal chips vs left rail), modals are fullscreen on mobile

---

## 6. Information density per route

| Route | Primary content type | Secondary |
|---|---|---|
| `/` | Character thumbnails (visual) | Names |
| `/browse/:id` | MoveCard grid | 4-cat sub-nav |
| `/character/:id/tactics` | MoveCard grid filtered by tag | 9-cat sub-nav, edit controls |
| `/tracker` | Counter + match log | Session stats, tilt badge |
| `/tracker/stats` | Tables | Trainer bridge links |
| `/punish/:id` | Punish-options table | Frame-disadvantage input |
| `/search` | MoveCard grid by character | Search box |

---

## 7. Empty states catalog

The "what does the user see when there's no data" inventory:

- **Tracker — no session yet:** "Ready to play" headline; counter and Log details button visible; match list says "Tap +W or +L to log your first."
- **Tracker stats — no structured matches:** "Log structured matches with your character set to see this."
- **Tracker stats — no matchup data:** "No matchup data yet — log matches with both characters set."
- **Tracker stats — no loss tags last 7d:** "No loss tags applied this week. Tag your losses with what went wrong to see patterns over time."
- **Tactics — character has no factory tags AND no slot:** "Build your own" CTA card with explanation + buttons. Sections show 50%-opacity beneath.
- **Tactics — empty section in active slot:** Italic "Limited tools — see Unique Mechanics for character-specific options here."
- **AddMoveModal — search miss:** "No moves match '{query}'"
- **SlotsPanel — at MAX_SLOTS:** Create buttons disabled with no-cursor styling

---

## 8. What's NOT in the app yet (gaps to consider)

These are flagged in the queue but absent today. Worth knowing when designing:

- **Combo Viewer** — no dedicated combo display surface yet. Combos are referenced inline in MoveCard `connectsTo`.
- **Pre-set intent** (V01.31 spec Phase 2 stretch) — pre-session goal + self-rating not implemented.
- **Custom loss tag UI** — engine has the function; no UI yet.
- **MR tracker / rival H2H / per-matchup notepad** — Phase 4, deferred.
- **Pressure String DB** — high priority per Matt feedback, scope undefined.
- **Card redesign** — Figma exists (node `1217:22251`), build slot pending.
- **Character expansion** — currently 7 of 30 SF6 chars.
- **Combo viewer / input notation icons** — Figma assets exist (nodes `1112:26705`, `1112:22432`, `1:1260`), build slots pending.
- **Onboarding / first-run flow** — none. New user lands on `/` cold.
- **About / help** — no documentation surface in-app.
- **Settings page** — there's no global settings (only per-feature ones in Tracker / Tactics slot manager). Worth thinking about whether a unified `/settings` route would help.

---

## 9. Things to consider for the redesign

A few prompts that may inform Figma work:

- **Nav slot count:** 5 top-level routes (Characters / Browse / Tactics / Tracker / Punish / Search). Mobile nav is hamburger; desktop has 4 inline buttons + character selector. Adding more risks crowding — consolidation candidates: Browse + Tactics into a single "Movelist" with view toggle, or push Search/Punish into a secondary menu.
- **Character context:** Tracker is character-agnostic by route, but uses the App's `selectedCharacterId` as default. Tactics/Browse/Punish are character-scoped via URL. Inconsistent — worth a design call.
- **Modal vs page:** Slot manager is currently a modal. With 5 slots + import/export, it might be better as a dedicated `/character/:id/tactics/slots` route.
- **Trainer bridge surface:** Currently only on Tracker → Browse. Could go bidirectional (from Browse, "log a recent match against this character").
- **Empty state philosophy:** Tracker leans into "Ready to play" framing. Tactics empty state is "Build your own." Worth aligning the voice across empty states.
