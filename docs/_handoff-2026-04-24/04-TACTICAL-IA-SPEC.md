# SF6 Combo Trainer — Tactical Guide IA Spec
## 9-Category Per-Character System

*Version 1.0 | April 2026*
*Target version: V01.30+*
*Companion: `sf6-character-worksheet.pdf`*

---

## 1. Philosophy & Goals

### 1.1 Why a New Lens

The existing app organizes Ken's 76 moves under four browse categories: Neutral, Offensive, Combo, Corner. Those buckets are useful for *learning a character*, but they don't map to *what's happening in a match*. When you're playing, you don't think "I need an offensive move" — you think "I need a poke," "I need to stuff this jump-in," or "they're in burnout, what's my dirtiest tool?"

The 9-category Tactical Guide adds a **situational lens** on top of the existing data. It does not replace the full movelist or the four browse categories. It is a curated, opinionated view that surfaces the 3–9 moves per character that matter most in each tactical situation.

### 1.2 Design Principles

This system follows three principles that should be enforced in every implementation decision:

**Curation over completeness.** The Tactical Guide shows the *best* moves for a situation, not all moves with that property. Ken has many moves that are technically pokes; only 3–4 belong in the Pokes section. If unsure, leave it out.

**Reuse over rebuild.** This is a new view on existing data. The `MoveCard` component, the Sheet schema, the routing, the PWA — all stay. New code is one route, one view component, one tag column.

**Tags, not buckets.** A move can appear in multiple tactical sections. Ken's 2MK is a poke *and* a DRC starter. Treating these as exclusive categories duplicates data and forces awkward placement decisions.

---

## 2. The Nine Categories

### 2.1 Definitions and Inclusion Criteria

Each category gets a one-sentence definition, the question it answers in a player's head, and the inclusion criteria for "should this move appear here?"

| # | Category | Player's Question | Inclusion Criteria |
|---|----------|-------------------|--------------------|
| 1 | **Pokes** | "What do I throw out at neutral range?" | Ground normals/specials with good range, low commitment, decent recovery, used to control space |
| 2 | **Anti-Airs** | "How do I stop their jump-in?" | Moves that reliably hit airborne opponents — ground normals (cr.HP), DPs, air-to-air normals |
| 3 | **+OB** (Plus on Block) | "What can I press after they block this?" | Moves with positive frame advantage on block; the pressure-continuation toolkit |
| 4 | **Super Arts** | "What do my SA1/SA2/SA3 do and when?" | All three super arts with situational guidance, not just inputs |
| 5 | **Meaties** | "What do I press on their wakeup?" | Moves with active frames long enough to time onto wakeup; oki options |
| 6 | **Burnout Harassment Tool** | "They're in burnout — what's my dirtiest pressure?" | Plus moves that chip, push to corner, or force unsafe defense in burnout |
| 7 | **DRC Combo** | "What's my Drive Rush Cancel route?" | Combos starting from a DRC'd normal; the bread-and-butter damage tool |
| 8 | **Super Arts Combo** | "How do I land my super in a combo?" | Confirmed routes into SA1/SA2/SA3, broken out by starter |
| 9 | **Unique Mechanics** | "What does this character have that no one else does?" | Character-defining tools — Jinrai rekkas, Hooligan, Denjin Charge, Hellfire, etc. |

### 2.2 Notes on Category Mixing

These 9 categories mix two axes:
- **What a move is**: Pokes, Anti-Airs, Super Arts, Unique Mechanics
- **When you use a move**: +OB, Meaties, Burnout Harassment, DRC Combo, Super Arts Combo

This is intentional. It mirrors how players actually think during a match. The IA does not pretend they're parallel — see §6 for the layout treatment.

### 2.3 Per-Category Card Count Targets

Aim for **3 cards minimum, 6 cards maximum** per category. Below 3 the section feels sparse; above 6 it becomes a movelist again and loses its "curated" value. If a character has more than 6 viable Pokes, pick the top 6 by frequency-of-use in high-level play.

For categories where a character has fewer than 3 viable options (e.g., a grappler with weak Pokes), display the 1–2 they have and add an italic note: *"Limited tools — see Unique Mechanics for grappler-specific neutral approach."*

---

## 3. Data Schema

### 3.1 Sheet Column Addition

Each character tab in the Google Sheet (Ken, Terry, Chun-Li, Luke, Cammy, Mai, Ryu) gets one new column:

```
tactical_tags
```

**Type**: comma-separated string
**Allowed values**: `pokes`, `anti-airs`, `plus-on-block`, `super-arts`, `meaties`, `burnout`, `drc-combo`, `super-combo`, `unique`
**Empty values**: allowed (most moves will not have tactical tags)
**Examples**:

| Move | tactical_tags |
|------|---------------|
| Ken 2MK | `pokes,drc-combo` |
| Ken cr.HP | `anti-airs` |
| Ken 5MP | `pokes,plus-on-block` |
| Ken Hadoken | (empty — not a top-tier tool in any of the 9) |
| Ken H.Jinrai → KKMK | `unique,drc-combo` |
| Ken Dragonlash Flame (SA1) | `super-arts,super-combo` |

### 3.2 Tag Order Convention

When a move has multiple tags, list the **primary** tag first. The primary tag is the one a player would name if asked "what's this move *for*?"

Ken 2MK = `pokes,drc-combo` (it's a poke that you sometimes DRC, not a combo starter that you sometimes throw out at range).

This matters because the front-end will use the primary tag as the move's badge color in cross-section views.

### 3.3 Tag-to-Display Map

The internal tag values are kebab-case for URL/code stability. Display strings live in a single config:

```js
// src/data/tacticalCategories.js
export const TACTICAL_CATEGORIES = [
  { id: 'pokes',          label: 'Pokes',                   order: 1 },
  { id: 'anti-airs',      label: 'Anti-Airs',               order: 2 },
  { id: 'plus-on-block',  label: '+OB',                     order: 3 },
  { id: 'super-arts',     label: 'Super Arts',              order: 4 },
  { id: 'meaties',        label: 'Meaties',                 order: 5 },
  { id: 'burnout',        label: 'Burnout Harassment',      order: 6 },
  { id: 'drc-combo',      label: 'DRC Combo',               order: 7 },
  { id: 'super-combo',    label: 'Super Arts Combo',        order: 8 },
  { id: 'unique',         label: 'Unique Mechanics',        order: 9 },
];
```

Single source of truth for label changes, sort order, and adding a 10th category later.

---

## 4. URL Routes

### 4.1 New Routes

```
/character/:id                       → Character overview hub (NEW)
/character/:id/tactics               → Full 9-section tactical guide (NEW)
/character/:id/tactics/:categoryId   → Single-category deep dive (NEW)
```

### 4.2 Existing Routes (Unchanged)

```
/                          → Landing
/browse/:character         → Full movelist browse (the current 4-cat view)
/search                    → Cross-character search
/punish                    → Punish calculator
```

### 4.3 Why a Hub Route

`/character/:id` is the new "home page" for a character. From it, a player chooses:
- **Tactical Guide** — opinionated, situational, good for match prep
- **Full Movelist** — exhaustive, browsable, good for exploration
- **Punish Calculator** — task-driven, good for "how do I punish X?"

This separates *learning paths* and prevents the Tactical Guide from competing with the full movelist for the same nav slot.

### 4.4 Deep-Linking Behavior

`/character/ken/tactics/pokes` opens the Tactics page scrolled to the Pokes section with that section's anchor highlighted. Shareable URLs for coaching ("here's what to do against Ken's pokes: [link]").

---

## 5. Component Reuse Map

### 5.1 Reused Components (No Changes)

- `MoveCard` — already supports flippable bidirectional view; works as-is
- `CharacterSelector` — already exists; new hub route uses it
- `SearchBar` — global search continues to index everything regardless of tag
- `PunishCalculator` — independent; not affected by this work

### 5.2 New Components

```
src/components/Tactics/
├── TacticsPage.jsx          → Full 9-section view (the route /character/:id/tactics)
├── TacticsCategorySection.jsx → One category: header + grid of MoveCards
├── TacticsSubNav.jsx         → Sticky sub-nav (left rail desktop, top tabs mobile)
└── TacticsCategoryDetail.jsx → Single-category deep dive (the :categoryId route)
```

Four new files. Everything else reused.

### 5.3 New Utility

```
src/utils/tacticalFilter.js
```

One function: `getMovesByTag(characterMoves, tagId)` returns array of moves where `tactical_tags` contains the tag, sorted by tag order (primary tags first).

### 5.4 Config

```
src/data/tacticalCategories.js  (see §3.3)
```

---

## 6. Layout Specifications

### 6.1 The Mixed-Axis Problem (and the Fix)

§2.2 noted that the 9 categories aren't truly parallel. The layout solves this by **visually grouping** them into two implicit zones, without making it explicit in the nav:

- Categories 1–4 (Pokes, Anti-Airs, +OB, Super Arts): "your toolkit"
- Categories 5–9 (Meaties, Burnout, DRC Combo, Super Combo, Unique): "your situational plays"

In practice this means: a subtle horizontal divider between Super Arts (4) and Meaties (5) on desktop. On mobile, the sub-nav has a small gap at that boundary. Players don't need to be told the grouping exists — they'll feel it.

### 6.2 Mobile (< 768px)

- Vertical stack of all 9 sections (matches Image 1 from your Figma)
- Sticky sub-nav at top: horizontal scroll of 9 chip-style category labels
- Tap a chip → smooth-scroll to that section
- Each section: category header (~40px tall), then horizontal scroll-snap row of MoveCards (1.5 cards visible at a time, swipe for more)
- Section spacing: 32px between sections

### 6.3 Tablet (768–1023px)

- Same sticky sub-nav behavior as mobile
- Each section: header + 2-column grid of MoveCards
- Section spacing: 40px between sections

### 6.4 Desktop (≥ 1024px)

- Two-pane layout:
  - Left rail (240px): Sticky vertical list of 9 categories with active-section highlighting (driven by IntersectionObserver)
  - Right pane (fluid): Scrolling document with all 9 sections, 3-column grid of MoveCards per section
- Subtle horizontal divider between section 4 (Super Arts) and section 5 (Meaties) — implements §6.1

### 6.5 Single-Category Detail (`/character/:id/tactics/:categoryId`)

Same component (`TacticsCategoryDetail`) regardless of breakpoint. Full-width header, larger MoveCard grid (1 col mobile, 2 col tablet, 3 col desktop), with prose space above the cards for matchup notes (future feature — leave the slot, no content yet).

---

## 7. Tagging Strategy & Editorial Process

### 7.1 Why Tags Beat Buckets

If categories were exclusive, Ken's 2MK would force a choice: is it a Poke or a DRC Combo? Both are true. With exclusive bucketing you either duplicate the move (data drift risk) or pick one and lose the other surface (discoverability loss).

Tags solve this cleanly. A move appears wherever it's relevant. The Sheet stays single-source-of-truth.

### 7.2 Tagging Guidelines for the Author (You)

When tagging a move, ask in this order:

1. **Is this one of the character's top 3–6 in any category?** If no, leave tags empty.
2. **What's the *primary* reason a player uses this move?** That's the first tag.
3. **What other category does this move belong in if a player thinks about it differently?** That's the second tag.
4. **Stop at 2 tags** unless the move is genuinely exceptional (e.g., a move that's a top poke, top +OB tool, AND top DRC starter — rare, but possible).

### 7.3 Anti-Patterns to Avoid

- **Don't tag every move with `unique` just because it's that character's.** `unique` is for *signature* mechanics, not "this character has this move."
- **Don't tag specials as `pokes` unless they're genuinely used at neutral range** for spacing (most aren't — they're combo enders or commitment tools).
- **Don't put combo enders in `super-combo` unless they're the SA confirm itself.** A 2MP that links into SA2 is a `drc-combo`/`pokes` move; only the SA2 input gets `super-combo`.

---

## 8. Migration Plan

### 8.1 Phased Rollout (Aligned with the Step Plan)

**Phase 1 (Step 1 — this doc):** IA spec + worksheet shipped. No code touched.

**Phase 2 (Step 2):** Add `tactical_tags` column to **Ken tab only**. Tag Ken's moves using the worksheet as your input form. Verify the Sheet → app data flow includes the new column (your existing CSV parser should pass it through unmodified — confirm by inspecting the parsed object in dev tools).

**Phase 3 (Step 3):** You design the Tactics page in Figma. I read via MCP, generate React.

**Phase 4 (Step 4):** Build `TacticsPage`, `TacticsCategorySection`, `TacticsSubNav`, sticky behavior, deep-link scroll, the divider treatment from §6.1. Ship `/character/ken/tactics`.

**Phase 5 (Step 5):** Validate Ken on mobile/tablet/desktop. Adjust. Once you're happy, tag the other 6 characters using the same worksheet workflow.

**Phase 6 (Step 6):** Update the streetfighter.com scraper to **preserve `tactical_tags`** on re-scrape. Logic: when re-scraping, merge new frame data into existing rows by move ID — never overwrite columns the scraper doesn't own. Tags live in the Sheet, scraper writes only frame data and move metadata.

### 8.2 Backward Compatibility

- The existing `/browse/:character` route stays untouched. The 4-category view continues to work.
- Existing PWA cache and Sheet sync logic does not need changes — the new column flows through the existing CSV parser.
- No URL changes for existing routes. No links to update.

### 8.3 Rollback

If the Tactics view has issues post-deploy, the route can be hidden by removing the link from the character hub. Data stays in the Sheet (no destructive change). Feature flag is one boolean in `tacticalCategories.js` if you want a softer kill switch.

---

## 9. Open Questions / Future Work

These are not blockers for V01.30 but worth flagging now so they're not forgotten.

**Q1. Do super arts deserve to be both a category (#4) and a combo destination (#8)?**
Yes — they're different things. #4 is "what does each SA do and when do I use it raw?" #8 is "how do I confirm into them?" Different mental models, different cards. Keep both.

**Q2. Should "Burnout Harassment Tool" be split into "your burnout offense" vs "their burnout offense" (defense)?**
Probably yes, but not in V01.30. Defending burnout is a universal skill (block, parry, drive reversal) more than a character-specific one. If user feedback shows this gap, add a 10th category later. The architecture supports it (just add to `tacticalCategories.js`).

**Q3. Cross-character category browsing — should `/tactics/pokes` show all characters' top pokes side-by-side?**
Compelling for matchup study. Out of scope for V01.30. Add to roadmap as a Phase 7 if Ken validates well.

**Q4. Matchup notes per category.**
The detail route (`§6.5`) leaves a slot for this. Schema TBD — likely a separate sheet tab `MatchupNotes` keyed on `(yourChar, oppChar, category)` returning markdown. Defer to V01.32+.

**Q5. Worksheet → Sheet automation.**
For now the worksheet is paper input → manual Sheet entry. If the per-character tagging volume justifies it, a Google Form mirror of the worksheet could write directly to a staging tab. Defer until you've done 3+ characters by hand and felt the pain.

---

## 10. Acceptance Criteria for Phase 4

The Tactics page ships when:

- [ ] `/character/ken/tactics` renders all 9 sections in the order from §3.3
- [ ] Each section shows 3–6 MoveCards filtered by `tactical_tags`
- [ ] Sticky sub-nav works on mobile (horizontal scroll) and desktop (left rail with active highlighting)
- [ ] Deep-link `/character/ken/tactics/pokes` scrolls to the Pokes section on load
- [ ] The visual divider between sections 4 and 5 is in place on desktop
- [ ] Empty categories (Ken has 0 tagged moves for that tag) render the "Limited tools" italic note from §2.3
- [ ] Lighthouse mobile score doesn't regress vs current `/browse/ken`
- [ ] PWA still installs cleanly and works offline (the new route is cached)

---

## Appendix A — Worksheet ↔ IA Mapping

The companion worksheet (`sf6-character-worksheet.pdf`) has 9 cells in a 3×3 grid. Each cell maps directly to one tactical category and to one tag:

| Worksheet Cell | Category | Tag |
|----------------|----------|-----|
| Row 1 / Col 1 | Pokes | `pokes` |
| Row 1 / Col 2 | Anti-Airs | `anti-airs` |
| Row 1 / Col 3 | +OB | `plus-on-block` |
| Row 2 / Col 1 | Super Arts | `super-arts` |
| Row 2 / Col 2 | Meaties | `meaties` |
| Row 2 / Col 3 | Burnout Harassment | `burnout` |
| Row 3 / Col 1 | DRC Combo | `drc-combo` |
| Row 3 / Col 2 | Super Arts Combo | `super-combo` |
| Row 3 / Col 3 | Unique Mechanics | `unique` |

Filling the worksheet for a character produces, in one pass, the exact data needed for the Sheet's `tactical_tags` column for that character.

---

*End of spec. Next deliverable: `sf6-character-worksheet.pdf` (3×3 printable, single side, 8.5×11).*
