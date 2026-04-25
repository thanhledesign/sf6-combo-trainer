# 09 — Capcom sync: unmatched moves (2026-04-25)

The Playwright-based `scripts/sync/scrape-capcom.mjs` matches Capcom moves to existing move IDs by `displayName`. 28 of ~530 moves (~95%) didn't match. Those listed below are mostly **throws** (annotations use generic "Forward Throw" / "Back Throw" names while Capcom uses character-specific names) and **specials with naming differences**.

To resolve each: open `src/data/annotations/<char>.json`, find the corresponding move, and rename `displayName` to match Capcom. Re-run `node scripts/sync/scrape-capcom.mjs --char=<id>` to verify it matches on the next sync.

## Per-character unmatched

### Ken
- `[Quick Dash] Shoryuken` (Special Moves) — annotation likely has `ken_qd_shoryuken` with simpler displayName
- `[Quick Dash] Tatsumaki Senpu-kyaku` (Special Moves) — `ken_qd_tatsumaki`?
- `[Quick Dash] Dragonlash Kick` (Special Moves) — `ken_qd_dragonlash`?
- `Kasai Thrust Kick` × 3 (Special Moves) — likely the L/M/H variants in `ken_kasai_*` IDs; sub-variants need disambiguation by level
- `Knee Strikes` (Throws) — likely `ken_throw_f` or `ken_throw_b`
- `Hell Wheel` (Throws) — the other throw

### Ryu
- `Shoulder Throw` (Throws) — `ryu_throw_f` or `ryu_throw_b`
- `Somersault Throw` (Throws) — the other throw

### Luke
- `Sweeper` (Throws)
- `Scrapper` (Throws)

### Chun-Li
- `Koshuto` (Throws)
- `Taiji Fan` (Throws)
- `Ryuseiraku` (Throws)

### Cammy
- `Cannon Strike(Charged)` (Special Moves) — annotation may not have a separate entry for charged variant
- `Rough Landing` (Throws)
- `Delta Throw` (Throws)
- `Leg Scissors Choke` (Throws)

### Mai
- `Shiranui Gourin` (Throws)
- `Fuusha Kuzushi` (Throws)
- `Yume Zakura` (Throws)

### Terry
- `SA2 Twin Geyser` (Super Arts) — sub-variant of `terry_sa2`
- `SA2 Triple Geyser` (Super Arts) — sub-variant
- `SA2 Triple Geyser (Dud)` (Super Arts) — sub-variant
- `Grasping Upper` (Throws)
- `Buster Throw` (Throws)
- `Drive Impact: Back Spin Kick` (Common Moves) — likely matches `terry_drive_impact` (annotation has it as a generic name)

## How the sync handles unmatched

- Capcom data for unmatched moves is **dropped** — they stay annotation-only.
- The app continues to render the annotation data unchanged for these.
- No silent corruption: scrape logs each unmatched at run time.
- Re-run after annotation rename → match succeeds → next sync's Capcom data lands.

## Suggested matcher improvements (future)

- **Throw heuristic**: characters with exactly 2 throws → first/second → `_throw_f`/`_throw_b`. Fragile for characters with extra command grabs (Cammy, Ken). Skipped for V1.
- **Quick-dash bracket prefix**: `[Quick Dash] Foo` → `<char>_qd_<slug-of-foo>`. Could automate for Ken's QD variants.
- **Sub-variant flattening**: keep main SA, ignore "(Dud)" / "Twin" / "Triple" sub-variants (they share frame data with the parent SA in some cases).

These are diminishing-returns. The fastest path is annotation renames against the unmatched list above.
