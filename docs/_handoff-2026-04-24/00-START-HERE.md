# 00 — START HERE

This folder is a **handoff package** for transitioning your SF6 Combo Trainer development from Claude (chat) to Claude Code (terminal).

You — the human — should read this file first. Then move CLAUDE.md to the repo root, then open Claude Code.

---

## What's In This Folder

| File | Purpose | Audience |
|------|---------|----------|
| `00-START-HERE.md` | This file | You |
| `01-NEXT-STEPS.md` | The task queue Claude Code will work through | Claude Code |
| `02-PROJECT-CONTEXT.md` | Condensed history & "why" of the project | Claude Code |
| `03-IOS-ANDROID-READINESS.md` | Architecture patterns for future native app | Claude Code |
| `04-TACTICAL-IA-SPEC.md` | Full spec for the 9-category Tactical Guide feature | Claude Code |
| `05-CHARACTER-WORKSHEET.pdf` | Printable worksheet for filling in tactics by hand | You (printer) |
| `06-KEN-TAGS-REFERENCE.md` | Starter tactical_tags suggestions for Ken's moves | You + Claude Code |

**One file lives outside this folder**: `CLAUDE.md` was placed at the repo root by the unzip. That's intentional — Claude Code reads `CLAUDE.md` automatically when you open the project.

---

## Your Three Steps

### Step 1: Verify the unzip placed files correctly

From your terminal, in the repo root:

```bash
ls CLAUDE.md
ls _handoff/
```

You should see `CLAUDE.md` listed, and the `_handoff/` folder should contain all the files in the table above.

If `CLAUDE.md` already existed in your repo and got overwritten, recover it from git: `git diff CLAUDE.md` to see what changed, then merge manually if needed. (Most likely it didn't exist — this is a new file for Claude Code.)

### Step 2: Install Claude Code (if not already installed)

If you haven't installed Claude Code yet:

```bash
npm install -g @anthropic-ai/claude-code
```

(Requires Node.js 18+. You already have Node since the project uses Vite — should work.)

### Step 3: Open Claude Code in the project

From the repo root:

```bash
claude
```

This launches Claude Code. It will automatically read `CLAUDE.md`. Your first message to it should be:

> Read CLAUDE.md and the files in _handoff/. Confirm you understand the project, the design philosophy, and your task queue. Don't start any tasks yet — just confirm understanding and flag anything unclear.

After it confirms, your next message can be:

> Begin Task 1.

---

## What This Handoff Covers

The decisions captured here (made by you in chat with Claude on April 24, 2026):

- **Password protection**: Claude Code will copy the pattern from your `dis-design-tool` repo — but it will ask you about this before implementing. Be ready to point it at that repo.
- **PWA**: Reinstate it (was removed in the latest commit). And start moving the codebase toward iOS/Android-readiness for an eventual native app via Capacitor.
- **Docs cleanup**: Two existing docs folders (`docs/` and `sf6-docs/`) have duplicates. Claude Code will consolidate them as Task 1.
- **Empty `.gitignore`**: Currently empty, so `node_modules/`, `dist/`, and macOS metadata files are tracked. Claude Code will fix this as Task 2.
- **Tactical Guide feature**: A new 9-category per-character tactical lens (Pokes, Anti-Airs, +OB, Super Arts, Meaties, Burnout Harassment, DRC Combo, Super Arts Combo, Unique Mechanics). Spec is in `04-TACTICAL-IA-SPEC.md`. Implementation comes after the cleanup tasks (T1–T4).

---

## What You Need To Do Manually

A few things Claude Code can't do for you:

1. **Print `05-CHARACTER-WORKSHEET.pdf`** — single side, 8.5×11. Use it when learning new characters.
2. **Add the `tactical_tags` column to your Google Sheet** — when Claude Code reaches Task 6, you'll be the one editing the Sheet. Use `06-KEN-TAGS-REFERENCE.md` as your starting point for Ken.
3. **Tell Claude Code about the `dis-design-tool` repo** — for the password gate pattern (Task 5). Have the URL ready.
4. **Decide on Figma wireframes** — Claude Code can read your Figma via MCP and translate to React, but it can't design layouts. When the Tactical Guide page is ready to build (after Task 6 setup), you design in Figma, then Claude Code implements.

---

## If Something Goes Wrong

- **Claude Code won't start**: Check `node --version` (need 18+). Reinstall: `npm install -g @anthropic-ai/claude-code`.
- **Claude Code seems confused about the project**: Tell it to re-read `CLAUDE.md` and `_handoff/` files. The handoff was thorough; if it's missing something, that's a gap to flag.
- **A task runs into something unexpected**: The task queue in `01-NEXT-STEPS.md` includes "if blocked" notes for each task. Most blockers should resolve themselves. If not, stop and ask.

---

That's it. Move CLAUDE.md (already at root from unzip), launch Claude Code, paste the kickoff prompt above. Onward.
