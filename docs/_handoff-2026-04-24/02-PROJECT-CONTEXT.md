# 02 — PROJECT CONTEXT

The "why" behind everything. Read this before making non-trivial decisions.

> **⚠️ ARCHITECTURE UPDATE 2026-04-25**
>
> The "Google Sheets CMS as source of truth" model described below was abandoned. The Sheet was never actually wired up at runtime (the `src/` code only ever imported static JSON), and pushing forward with it would have made every Capcom patch destroy Thanh's hand-curated tactical content.
>
> Current data architecture: three-layer JSON in `src/data/{capcom,annotations,overrides}/`, merged at runtime by `src/data/characters/loader.js`. Capcom layer is machine-managed (auto-scrape deferred — see `08-DATA-PIPELINE-RESEARCH.md`). Annotation layer holds Thanh's IP. Override layer patches Capcom errors.
>
> Read `08-DATA-PIPELINE-RESEARCH.md` for the full reasoning and the deferred auto-scrape plan. The Sheet references below are kept for historical context but are **no longer the source of truth**.

---

## The Owner

**Thanh Le.** Designer by trade, building this app as both a personal training companion and a portfolio project. Active SF6 ranked player at the time of this handoff (April 2026):

- Plays Ken (main), peak ~1,600 MR, currently in High Master
- Pays for coaching from **musclenoob** (UK-based Ken specialist)
- Maintains systematic loss-tracking documents (categorized by Execution / Defense / Knowledge / Awareness / Matchup / Coaching violation)
- Uses on-screen reminders during ranked play (≤50 chars per line constraint)

**Why this matters for the codebase.** Thanh is the primary user. The app's design decisions reflect his actual ranked play needs. When evaluating a feature request, the question "would this help Thanh win matches" is a useful proxy for "would this help intermediate players generally."

---

## The Core Problem the App Solves

Existing frame data tools (Supercombo.gg, official Capcom data, sfbuff.site) all share one structural problem: **they organize information by your character's moves**. You select Ken, you see Ken's move list, you browse properties.

This assumes you already know what you're looking for. In an actual match, you don't. You're reacting to the opponent. You blocked something — what now? They jumped — what stops it? They knocked you down — what's safe? You're plus on block — what do you press?

The app inverts this. You select your character, but the primary surface is **opponent characters' moves seen through your character's lens**. Match-relevant questions get match-relevant answers.

This is documented in `claude-breif-sf6-app.pdf` (in the project knowledge). Read it if you need the full positioning rationale.

---

## How the App Currently Works (V01.29 minus PWA)

### Routes (already shipped)

- `/` — Landing
- `/browse/:character` — Full movelist by tactical category (Neutral / Offensive / Combo / Corner — these are the **existing** 4 categories, not to be confused with the new 9-category Tactical Guide)
- `/search` — Cross-character search
- `/punish` — Punish calculator (input frame disadvantage → see your character's punish options)

### Data Flow

```
Google Sheet (per-character tabs)
   ↓ published as CSV
Custom CSV parser (handles quoted fields, commas, newlines)
   ↓
Runtime fetch (with ~5min cache)
   ↓
React components (MoveCard, etc.)
```

Static JSON in `src/data/characters/` exists as a **fallback** if the Sheet fetch fails. It's NOT the source of truth — the Sheet is. Don't update the JSON manually expecting it to override the Sheet.

### Key Components

- **MoveCard** — flippable, bidirectional. Front = your perspective; back = opponent perspective. This is the heart of the app.
- **CharacterSelector** — modal-style picker
- **PunishCalculator** — task-driven view, decoupled from browse
- **Search** — global, indexes everything

### Mobile/Tablet/Desktop

Mobile-first throughout. Hamburger menu, sticky nav, 1-column at base, scaling to 3–4 columns on desktop. Safe-area CSS for notched iOS devices (currently broken since PWA was removed — Task 3 restores).

---

## What's Done and What's Coming

### Completed Features (as of V01.29)

| Feature | Notes |
|---------|-------|
| Character selection (7 characters) | Ken, Terry, Chun-Li, Luke, Cammy, Mai, Ryu |
| Flippable MoveCard | Bidirectional view core interaction |
| Browse by tactical category (4 cats) | Neutral / Offensive / Combo / Corner |
| Cross-character search | Indexes move names, inputs, tactical descriptions |
| Punish Calculator | Input frame disadvantage → see options |
| Mobile hamburger nav | Sticky on scroll |
| 2-column compact card view | Mobile density toggle |
| Google Sheets CMS | Live frame data updates without code deploys |
| ~~PWA~~ | **Was shipped in V01.29, removed in latest commit. Task 3 reinstates.** |

### In Flight or Planned

| Feature | Status | Where to find detail |
|---------|--------|---------------------|
| Docs cleanup | Task 1 | `01-NEXT-STEPS.md` |
| `.gitignore` fix | Task 2 | `01-NEXT-STEPS.md` |
| PWA reinstate | Task 3 | `01-NEXT-STEPS.md` |
| iOS/Android-readiness audit | Task 4 | `03-IOS-ANDROID-READINESS.md` |
| Password protection | Task 5 (blocked on user input) | `01-NEXT-STEPS.md` |
| **9-category Tactical Guide** | Task 6 (Sheet prep) → then Phases 3–5 | `04-TACTICAL-IA-SPEC.md` |
| Card redesign | Wireframes done in Figma, awaiting build slot | Figma node `1217:22251` |
| Combo Viewer | Wireframes pending in Figma | Figma node `1112:26705` |
| Input notation icons | Wireframes done in Figma | Figma nodes `1112:22432`, `1:1260` |
| Frame data badges (color-coded) | Spec'd, awaiting build slot | Per Figma design system |
| Pressure String Database | High priority per user feedback ("Matt") | Roadmap doc |
| Full 28-char roster | Long-term — currently at 7 | Roadmap doc |

### The 9-Category Tactical Guide (Big Feature)

This is the next major user-facing feature. It adds a **new lens** on top of the existing data — not a replacement for the 4-category browse view. The 9 categories:

1. Pokes
2. Anti-Airs
3. +OB (Plus on Block)
4. Super Arts
5. Meaties
6. Burnout Harassment Tool
7. DRC Combo
8. Super Arts Combo
9. Unique Mechanics (renamed from "Misc" by user)

These categories come from how Thanh and other intermediate players actually think during a match. Each category surfaces 3–6 curated moves per character (not the full movelist).

**Implementation approach**: tag moves with `tactical_tags` column in the Sheet (multi-tag, comma-separated). UI is a filtered view of existing MoveCards. See `04-TACTICAL-IA-SPEC.md` for the complete spec.

**Why the spec exists.** Without it, the natural temptation is to build 9 hard-bucketed lists, which forces awkward choices (is Ken's 2MK a Poke or a DRC starter?). Tags solve this cleanly. The spec also addresses URL routing, mobile/desktop layouts, the implicit grouping treatment for the mixed-axis problem, and the worksheet → Sheet workflow.

---

## Constraints and Decisions Made

These are decisions Thanh has made that override default approaches:

### Architectural

- **Sheet = source of truth for frame data.** Static JSON is a fallback only.
- **Tags, not buckets.** Moves can be in multiple tactical categories.
- **Curation over completeness.** The Tactical Guide shows the top 3–6 per category, not everything that qualifies.
- **iOS/Android-ready architecture** even though only PWA ships now. See `03-IOS-ANDROID-READINESS.md`.
- **Versioning convention**: `V01.XX` tags, incremented per significant feature.

### Visual

- **Dark theme always.** `gray-900` background, `purple-600` accent.
- **Purple gradient** (`#7c3aed → #4f46e5`) is the brand. Used in PWA icon, card backgrounds (planned), branding.
- **Two fonts**: City Brawlers (character names, button text), Inter (everything else).
- **Card redesign** is scoped and isolated — when it ships, it touches **cards only**. Nav, character select, browse page, and existing colors stay.

### Process

- **Figma is the design source of truth.** Thanh designs in Figma; Claude Code reads via MCP and translates to React. Claude Code does not invent layouts.
- **Branch for non-trivial work.** Vercel preview URLs make review easy.
- **Staging can stay live while production toggles off.** Useful during disruptive changes.
- **Network drive for storage.** Thanh's primary dev environment uses a network drive for file storage — this is why AppleDouble files (`._*`) keep appearing. The `.gitignore` fix in Task 2 handles this.

---

## Existing Documentation (Will Be Consolidated in Task 1)

These docs exist in the repo today. Some are useful, some are stale. After Task 1 they'll all live in `docs/`:

### In `docs/`
- `ENVIRONMENT.md` — dev environment notes
- `FIGMA-DESIGN-SYSTEM.md` — Figma file structure & design tokens
- `INTAKE-TEMPLATE.md` — project intake template
- `KNOWN-ISSUES.md` — bug log
- `SESSION-LOG.md` — session-by-session work log
- `SF6-Development-Roadmap.md` — feature roadmap (DUPLICATED in `sf6-docs/`)
- `SF6-MASTER-HANDOFF.md` — older handoff doc (DUPLICATED in `sf6-docs/`)
- `USER-PREFERENCES.md` — Thanh's coding preferences
- `VERSION-HISTORY.md` — version log

### In `sf6-docs/` (will be merged into `docs/`)
- `SF6-Combo-Trainer-Progress-Summary.md` — high-level progress
- `SF6-MASTER-HANDOFF.md` — DUPLICATE
- `SF6-Complete-Character-Data-Reference.md` — character-by-character data ref
- `SF6-Technical-Architecture.md` — full architecture doc, very useful
- `SF6-Development-Roadmap.md` — DUPLICATE
- `SF6-User-Feedback-Testing.md` — early validation feedback (notably from "Matt" who pushed for the Pressure String DB)

When in doubt about which version of a duplicate is canonical: prefer the one in `sf6-docs/` (newer based on filenames suggesting later iteration).

---

## Project Knowledge Files (in this conversation's project, not the repo)

For Claude Code's reference — these files exist in Thanh's Claude project knowledge but are NOT in the git repo. Some are referenced in the docs above:

- `claude-breif-sf6-app.pdf` — the original product brief (positioning, core philosophy, MVP scope)
- `Terry_Data_Part_1_*.txt` — Terry character data export
- `sf6-flowcharts.jsx`, `ken-learning-flowchart.jsx` — earlier explorations of flowchart UI (deprecated approach — too complex; abandoned in favor of the current card-based browse)
- `sf6-ken-data-analysis.md` — Ken-specific analysis notes
- `SF6-Character-Learning-Template.md` — template for documenting new characters
- `SF6-Character-Cheat-Sheet.md`, `SF6-Opponent-Cheat-Sheet.md` — printable cheat sheets (predecessors to the current worksheet)
- `SF6-Universal-Knowledge-Guide.md` — universal SF6 knowledge framework (round flow, drive system, etc.)
- `ken-coaching-v2.docx`, `sf6-session-tracker.docx` — Thanh's personal coaching/tracking docs

If Claude Code needs information from any of these, ask the user to paste relevant sections — Claude Code can't access Claude project knowledge directly.

---

## How To Stay In Sync With Thanh's Mental Model

Three things that come up repeatedly in conversations:

1. **The "+7 magic number"** — Ken's target combo confirms work cleanly off knockdowns that give +7 advantage. When Thanh references this, he means the threshold for landing a meaty 5HP into combo confirm.

2. **"Golden Oki" / "+43"** — Ken's optimal knockdown advantage from Run > Tatsu. Sets up the KKMK/KKLK overhead/low mixup system. Reference point for "best case oki."

3. **Coaching principles from musclenoob**: 3-bar Drive meter floor, 1 EX DP per game max, cr.HP as primary anti-air, run cancel ender decision tree (midscreen→Tatsu, corner→DP, kill→super). When in doubt about whether a feature serves Thanh's actual play, these are the rails.

These aren't trivia — they show up in feature priorities and in how cards should be presented. The app's purpose is to teach decision-making aligned with high-level coaching.
