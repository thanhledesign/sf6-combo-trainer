# 01 — NEXT STEPS

This is your task queue. Work through it in order. Each task has: **What**, **Why**, **Done When**, and **If Blocked**.

**Do not skip ahead.** Tasks 1–4 are cleanup that makes Tasks 5–6 (and everything after) safer. Task 5 requires user input before implementation.

---

## Task 1 — Consolidate `docs/` and `sf6-docs/`

**What.** Two docs folders exist with overlapping files (both contain `SF6-MASTER-HANDOFF.md` and `SF6-Development-Roadmap.md`). Pick one canonical location, merge content, delete the other.

**Why.** Reduces cognitive load, prevents future Claude sessions from reading stale duplicates and acting on out-of-date info.

**How.**
1. Inventory both folders. List every file in each.
2. For overlapping filenames: `diff` them. Keep the newer/more complete version.
3. For unique files: move them all into `docs/`.
4. Move the `_handoff/` files into `docs/_handoff-2026-04-24/` (preserving the date so history is clear).
5. Delete `sf6-docs/`.
6. Update any internal links in docs that referenced `sf6-docs/`.
7. Commit: `chore: consolidate docs into single docs/ folder`.

**Done when.** Only `docs/` exists. Every previously-existing file is accounted for. No broken internal doc links.

**If blocked.** If two versions of the same file have meaningfully different content and you can't tell which is canonical, leave both temporarily with `-OLD` and `-NEW` suffixes in `docs/` and flag the conflict to the user.

---

## Task 2 — Fix `.gitignore` and untrack noise

**What.** `.gitignore` is currently empty (0 bytes). As a result, `node_modules/` (366 entries, ~12k tracked files), `dist/` (build output), and macOS AppleDouble files (`._*`, `.DS_Store`) are all in the repo.

**Why.** Bloats clones (currently 38MB; should be ~2MB). Slows CI. Causes cross-platform issues. Makes git history noisy. This is technical debt that compounds.

**How.**
1. Create a proper `.gitignore` covering at minimum:
   - `node_modules/`
   - `dist/`
   - `.DS_Store` and `._*` (AppleDouble metadata from network drives)
   - `.env`, `.env.local`, `.env.*.local` (for password protection env var coming in T5)
   - `.vercel/`
   - Editor metadata (`.vscode/` and `.idea/` per user preference — confirm with user if unsure)
   - Build artifacts and logs
2. Untrack the offending files in one batch:
   ```bash
   git rm -r --cached node_modules/ dist/ .DS_Store
   find . -name "._*" -not -path "./.git/*" -exec git rm --cached {} \;
   ```
3. Commit `.gitignore` + the untracking together: `chore: add .gitignore, untrack node_modules and build artifacts`.
4. Verify: `git status` should be clean. `git ls-files | grep node_modules` should return nothing.

**Done when.** `.gitignore` is populated. `node_modules/`, `dist/`, AppleDouble files no longer appear in `git ls-files`.

**If blocked.** If `.env` or other secrets-bearing files are already tracked, do NOT just untrack them — they're in git history. Flag to the user that secrets rotation may be needed.

---

## Task 3 — Reinstate PWA (and bump to V01.30)

**What.** PWA was removed in commit `739eced` ("Fix: clean build setup"). The user wants it back: installable, offline-capable, with the purple gradient app icon. This was a feature of V01.29.

**Why.** Per the user's project notes, V01.29 had `vite-plugin-pwa` with Workbox, mobile install prompts, safe-area CSS for notched devices, and ImageMagick-generated icons (`gradient:'#7c3aed-#4f46e5'` purple gradient). The "Fix: clean build setup" commit stripped both the dependency and the vite.config.js references. User does not know why it was removed.

**How.**
1. **First — check why it was removed.** Run `git show 739eced --stat` and `git show 739eced -- vite.config.js package.json`. If the commit message or diff hints at a build error, address that first. Common causes: workbox plugin incompatibility with Vite 7, manifest path issues, icon path issues.
2. Re-add `vite-plugin-pwa` to `devDependencies`. Use the latest version compatible with Vite 7.
3. Re-add the PWA plugin to `vite.config.js`. Configuration should include:
   - Manifest with name, short_name, theme_color (`#7c3aed`), background_color, icons (multiple sizes)
   - Workbox config: NetworkFirst strategy with ~1hr expiration for the Google Sheet CSV responses
   - `registerType: 'autoUpdate'`
4. Restore PWA icons. Check `public/` for any existing icons; if missing, generate with ImageMagick using the existing `#7c3aed → #4f46e5` purple gradient at all required sizes (192, 512, maskable variants).
5. Restore safe-area CSS in the global stylesheet (`env(safe-area-inset-*)` for top/bottom — important for iPhone notches and home indicators).
6. Test locally: `npm run build && npm run preview`, then in Chrome DevTools → Application → Manifest verify it parses, and check Lighthouse PWA score.
7. Bump version comment in code from V01.29 to V01.30.
8. Commit: `feat(pwa): reinstate PWA support with workbox caching (V01.30)`.

**Done when.** App is installable from a mobile browser. Lighthouse PWA audit passes. Sheet data still syncs (no regression in the CMS layer). Local build succeeds.

**If blocked.** If `vite-plugin-pwa` has incompatibility with Vite 7, document the specific error and consult the plugin's GitHub issues before improvising. Don't downgrade Vite to make PWA work — that creates worse debt.

---

## Task 4 — Audit & refactor for iOS/Android-readiness (Capacitor prep)

**What.** User intends to eventually ship as a native iOS/Android app via Capacitor. Audit the codebase for browser-only patterns that would break on native, and refactor the worst offenders into platform-abstracted layers. Read `_handoff/03-IOS-ANDROID-READINESS.md` for the full pattern guide.

**Why.** It's much cheaper to keep the codebase native-ready as it grows than to retrofit later. The user's project notes mention "abstraction layers for storage/haptics already scaffolded" — verify they actually exist and extend them.

**How.**
1. Read `_handoff/03-IOS-ANDROID-READINESS.md` end to end before touching code.
2. Audit pass — grep for problem patterns across `src/`:
   - `localStorage` / `sessionStorage` direct usage (should go through a storage abstraction)
   - `navigator.vibrate` direct usage (should go through a haptics abstraction)
   - `window.location` direct usage (should go through router or a navigation abstraction)
   - Hardcoded `http://localhost` or `https://...` URLs (should be config)
   - Direct `document.cookie` usage
3. For each problem found: either (a) move it behind an existing abstraction, (b) create a new abstraction, or (c) document why it's acceptable.
4. Verify or create the abstraction modules in `src/utils/platform/`:
   - `storage.js` — wraps localStorage now, ready to swap for Capacitor Preferences
   - `haptics.js` — wraps navigator.vibrate now, ready to swap for Capacitor Haptics
   - `network.js` — fetch wrapper, ready to swap for Capacitor Http if needed
5. Do NOT install Capacitor itself yet. This task is preparation only — actual Capacitor integration is a future feature.
6. Commit: `refactor: extract platform abstractions for native-readiness`.

**Done when.** No direct `localStorage`/`sessionStorage`/`navigator.vibrate` calls outside `src/utils/platform/`. PWA still works (regression check).

**If blocked.** If a third-party dependency uses these APIs internally, that's fine — note it in `_handoff/03-IOS-ANDROID-READINESS.md` under "known compromises" and move on.

---

## Task 5 — Implement password protection (USER INPUT REQUIRED)

**What.** Add password protection to the deployed app, matching the pattern used in the user's `dis-design-tool` repo.

**STOP — before doing anything, ask the user:**

> Before I implement password protection, I need access to the pattern from your dis-design-tool repo. Can you do one of:
> 1. Share the repo URL so I can clone it locally and inspect the implementation
> 2. Paste the relevant component(s) and config from that repo
> 3. Describe the pattern in detail (gate component, where it lives, env var name, session/local storage, timeout behavior)
>
> I'll wait for your response before writing any code.

Do not proceed without that input. Do not invent a pattern.

**Why.** The user explicitly chose the "copy from dis-design-tool" path so the new gate behaves consistently with their other Vercel apps. Improvising a different pattern defeats that goal.

**How (after user provides pattern).**
1. Mirror the implementation in this repo's component structure.
2. Use the same env var naming convention as `dis-design-tool` (likely `VITE_APP_PASSWORD` — but confirm).
3. Make sure the env var is in `.gitignore` patterns from T2 (`.env*`).
4. Set the env var in Vercel project settings (production AND preview environments) — instruct user to do this; you cannot.
5. Test locally with a `.env.local` file.
6. Verify session behavior matches dis-design-tool (timeout, persistence on refresh, clearing on tab close).
7. Commit: `feat(auth): add password gate matching dis-design-tool pattern`.

**Done when.** Visiting the deployed app prompts for password. Correct password unlocks access. Session behavior matches `dis-design-tool`. Env var is documented in README.

**If blocked.** If the user can't provide the dis-design-tool repo, fall back to the standard Vite/React password gate pattern (sessionStorage + env var) and clearly note this divergence in the commit message.

---

## Task 6 — Begin Tactical Guide implementation (Phase 2)

**What.** Begin building the 9-category Tactical Guide feature. Phase 2 of the IA spec is a Sheet-only change: add a `tactical_tags` column to the Ken tab and verify the data flow end-to-end.

**Why.** The Tactical Guide is the next major user-facing feature. Per the IA spec, it ships per-character (Ken first, then validate, then roll out to other 6).

**How.**
1. Read `_handoff/04-TACTICAL-IA-SPEC.md` end to end. The spec is detailed and authoritative.
2. **User action required, instruct them**: Add `tactical_tags` column to the Ken tab in the Google Sheet. Reference `_handoff/06-KEN-TAGS-REFERENCE.md` for the starter tag suggestions.
3. Verify the existing CSV parser passes the new column through unmodified. Inspect a parsed Ken move object in dev tools — `tactical_tags` should appear as a string field.
4. If the parser drops it, fix the parser. (Should be a one-line addition to the schema.)
5. Add `src/data/tacticalCategories.js` per spec §3.3 (the 9-category config).
6. Add `src/utils/tacticalFilter.js` per spec §5.3 (the `getMovesByTag` function).
7. **Stop here.** The actual UI work (Phase 4 of the spec) requires Figma wireframes from the user before implementation. Do not invent the layout.

**Done when.** Sheet has the new column populated for Ken. App parses the column without error. Config and utility files exist. User has been notified that Figma wireframes are the next gating item.

**If blocked.** If the user doesn't want to fill in tactical tags right now, T6 can pause here. Subsequent tasks (Phase 3+ of the spec) require either tagged data or wireframes — both of which require user effort.

---

## What Comes After Task 6

Items NOT in this queue but flagged in user memory / project notes for after V01.30:

- Card redesign (purple gradient, gradient border, color-coded frame data badges) — wireframes in Figma already exist per user notes; check Figma node `1217:22251`
- Combo Viewer — Figma node `1112:26705`
- Input notation icons — Figma nodes `1112:22432` (arrows), `1:1260` (buttons)
- Frame data badges (color-coded startup/active/recovery)
- Pressure String Database (high priority per "Matt" feedback in user memory)
- Expanding from 7 chars to full 28-char roster

These are the user's stated priorities. Don't start them without explicit go-ahead — they're listed for awareness, not for execution.

---

## Working Style

- **Make tight, well-named commits.** One concern per commit. Past commit messages have been terse ("Fix: clean build setup") which made this handoff harder to write — do better.
- **Branch for non-trivial changes.** Tasks 3, 4, 5, 6 are all worth their own branches. Vercel preview URLs make review easy.
- **Bump V01.XX version in code when shipping a feature.** Currently V01.29; T3 takes us to V01.30; subsequent feature work continues incrementing.
- **Keep `_handoff/02-PROJECT-CONTEXT.md` "Current State" section current.** Update it as tasks complete.
