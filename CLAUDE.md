# CLAUDE.md

This file is read automatically by Claude Code when the project opens. Keep it tight — detailed context lives in `docs/` (the original handoff package is archived in `docs/_handoff-2026-04-24/`).

---

## What This Project Is

**SF6 Combo Trainer** — a React+Vite+Tailwind web app for Street Fighter 6 counterplay education. The app helps intermediate players learn what to do *when they block specific moves* (opponent-first design), rather than just memorizing their own combos.

- **Live**: https://sf6-combo-trainer.vercel.app
- **GitHub**: https://github.com/thanhledesign/sf6-combo-trainer
- **Current version**: V01.30 (PWA reinstated; T3 done)
- **Owner**: Thanh Le. Active SF6 ranked player (Ken main, peak ~1,600 MR), uses the app as a personal training companion

---

## Core Design Philosophy (Do Not Drift From This)

**Opponent-first.** Every other frame data tool organizes information by *your* character's moves. This app flips it: you select your character, but you're browsing *opponent* characters' moves to see what you can do against them. The IA mirrors actual gameplay — you're reacting to opponent actions, not executing your own moves in a vacuum.

**Bidirectional cards.** Each move card shows both player perspective (when to use, what it combos into) and opponent perspective (what to do when you block it, frame advantage, punishes). The flip is the core interaction.

**Damage-first hierarchy.** Lead with what matters for winning. Don't bury punish opportunities under execution reference.

**Active learning over passive reference.** This is not a wiki.

---

## Tech Stack

- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS 3.4 (dark theme: `gray-900` bg, `purple-600` accent)
- **Routing**: react-router-dom 7
- **Icons**: lucide-react
- **Data**: Three-layer static JSON, merged at runtime by `src/data/characters/loader.js`
- **Deploy**: Vercel (staging on non-`main` branches, production on `main`)
- **PWA**: vite-plugin-pwa with Workbox (CacheFirst for videos w/ 30d). Manifest at `vite.config.js`; icons in `public/icons/` (purple gradient `#7c3aed → #4f46e5`).

### Data Layers (`src/data/`)
- **capcom/{name}.json** — frame numbers from Capcom (machine-managed in future, hand-keyed today). Never edit by hand if you can avoid it.
- **annotations/{name}.json** — Thanh's IP: tactical use, perspectives, combo connectsTo, IA tactics, tactical_tags. **This is where you spend 95% of editing time.**
- **overrides/{name}.json** — sparse corrections to Capcom values (rare, only when you've frame-verified Capcom is wrong).
- 7 chars currently, ~538 moves total. Roster expansion: write two new files per character (capcom + annotations) per `npm run sync-data` instructions.
- **Future auto-sync**: see `docs/_handoff-2026-04-24/08-DATA-PIPELINE-RESEARCH.md` — Capcom data isn't in HTML (client-side fetched), needs Playwright.
- **Source URLs** (for hand-keying): https://www.streetfighter.com/6/character/{name}/{frame,movelist}

### Figma (MCP-Connected)
- **File**: Bc7305TyPGELiIE4rmwVJe
- **Key nodes**: Card design 1217:22251, Combo viewer 1112:26705, Arrows 1112:22432, Buttons 1:1260
- **Font**: City Brawlers (character names, button text), Inter (everything else)

---

## Code Style

- Functional React components only (no classes)
- Mobile-first Tailwind (base = mobile, `md:` = tablet, `lg:` = desktop)
- Dark theme always
- Best practices oriented toward new learners
- 100% consistency over cleverness
- Versioning: increment `V01.XX` tags with each significant feature addition (currently V01.30 → next is V01.31, the win/loss tracker per `docs/_handoff-2026-04-24/07-WIN-LOSS-TRACKER-SPEC.md`)

---

## What To Do First

Read these in order (archived from the original April 2026 handoff package):

1. **`docs/_handoff-2026-04-24/00-START-HERE.md`** — orientation
2. **`docs/_handoff-2026-04-24/01-NEXT-STEPS.md`** — task queue (T1 → T6, in order)
3. **`docs/_handoff-2026-04-24/02-PROJECT-CONTEXT.md`** — the why behind everything

Then check `01-NEXT-STEPS.md` for the next pending task. (Task 1 — docs consolidation — was completed 2026-04-24; the file you're reading reflects that.)

**Do not skip the handoff files.** They contain decisions made by Thanh that override what you'd otherwise infer from existing docs (some of which are out of date).

---

## Critical Behaviors

- **Always confirm before destructive actions.** Deleting files, force-pushes, dropping branches, anything irreversible — ask first.
- **Versioning matters.** When a feature lands, bump the version comment in code and update `docs/_handoff-2026-04-24/02-PROJECT-CONTEXT.md` "Current state" section.
- **Sheet schema changes need migration notes.** If you add a column to the Sheet, document it. Don't break the runtime CSV parser silently.
- **Don't introduce browser-only APIs in business logic.** This codebase is being prepped for Capacitor → native iOS/Android. See `docs/_handoff-2026-04-24/03-IOS-ANDROID-READINESS.md` for patterns.
- **The `tactical_tags` system is the next big feature.** See `docs/_handoff-2026-04-24/04-TACTICAL-IA-SPEC.md`. Don't start it until Tasks 1–4 are done.
