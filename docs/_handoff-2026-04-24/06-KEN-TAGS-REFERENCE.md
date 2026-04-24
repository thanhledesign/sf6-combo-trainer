# 06 — KEN TACTICAL TAGS REFERENCE

Starter suggestions for Ken's `tactical_tags` Sheet column. Use this as a starting point — verify with your own knowledge and current patch data before publishing.

---

## How To Use This

1. Open the Ken tab in the Google Sheet (`1Z1InqW1dISE5kgDJWM47PF_gznjt7zJhw4_3LyriSpE`).
2. Add a new column at the end called exactly `tactical_tags` (lowercase, underscore — must match what the parser reads).
3. For each move in the table below, set the `tactical_tags` cell to the **exact comma-separated string** shown. **No spaces** between tags.
4. For moves not listed here, leave `tactical_tags` empty. The Tactical Guide is curated — most moves don't belong in any of the 9 sections.
5. After all rows are filled, save the sheet. Wait ~5 minutes for the cache to refresh, then verify in the deployed app dev tools that `tactical_tags` shows up on the Ken move objects.

---

## The Nine Categories (Quick Reference)

| Tag | Category | What goes here |
|-----|----------|----------------|
| `pokes` | Pokes | Top 3–6 ground pokes for neutral spacing |
| `anti-airs` | Anti-Airs | Reliable jump-stoppers |
| `plus-on-block` | +OB (Plus on Block) | Pressure-continuation tools |
| `super-arts` | Super Arts | All three SAs as raw situational tools |
| `meaties` | Meaties | Wakeup pressure options |
| `burnout` | Burnout Harassment | Dirtiest pressure when opponent is in burnout |
| `drc-combo` | DRC Combo | Drive Rush Cancel starters |
| `super-combo` | Super Arts Combo | Confirms and routes into supers |
| `unique` | Unique Mechanics | Character-defining tools (Jinrai, Run, etc.) |

**Multi-tag rule**: list primary tag first. If a move's *main* purpose is poking but you sometimes DRC it, tag it `pokes,drc-combo` (not the other way around).

**Cap at 2 tags** unless the move is genuinely exceptional. 3+ tags is rare.

---

## Ken's Suggested Tags

**⚠️ These are starting suggestions, not gospel.** You main Ken — verify each one against your actual play and current patch. If you disagree, change them. The point of this reference is to skip the blank-page problem, not to dictate.

### Pokes

| Move | Tags | Why |
|------|------|-----|
| 5MP (st.MP) | `pokes,plus-on-block` | Cancelable mid-range poke, +1 on block |
| 2MK (cr.MK) | `pokes,drc-combo` | Primary low poke, the DRC starter |
| 5HP (st.HP) | `pokes,drc-combo,meaties` | Big damage poke, DRC starter, long active for meaty |
| 5HK (st.HK) | `pokes` | Long-range whiff punisher (more situational than 5MP/2MK) |
| 6MP (Step Kick) | `pokes,plus-on-block` | Forward-moving safe poke |

### Anti-Airs

| Move | Tags | Why |
|------|------|-----|
| 2HP (cr.HP) | `anti-airs` | Primary anti-air per musclenoob's framework |
| Shoryuken (any) | `anti-airs,super-combo` | Reversal AA, also DP combo ender |
| j.MP (jumping MP) | `anti-airs` | Air-to-air option |
| Drive Impact | `anti-airs` | On read only — 26f startup is a commitment |

### +OB (Plus on Block)

| Move | Tags | Why |
|------|------|-----|
| 5MP (already tagged) | already in `pokes,plus-on-block` | +1 on block, frame trap material |
| 6MP (Step Kick, already tagged) | already in `pokes,plus-on-block` | Plus on block when spaced |
| Light Jinrai → Stop | `plus-on-block,unique` | Plus on block from rekka cancel |
| H Dragonlash (close) | `plus-on-block` | Situational plus tool |

(Note: most of Ken's +OB tools are already tagged elsewhere as primary. The `plus-on-block` tag stacks on those. Only pure +OB moves need exclusive `plus-on-block` first.)

### Super Arts

| Move | Tags | Why |
|------|------|-----|
| Dragonlash Flame (SA1) | `super-arts,super-combo` | Damage and oki, primary combo super |
| Shippu Jinrai-Kyaku (SA2) | `super-arts,super-combo` | Mid-screen high-damage super |
| Shinryu-Reppa (SA3 / CA) | `super-arts` | Kill super, situational raw use |

### Meaties

| Move | Tags | Why |
|------|------|-----|
| 5HP (already tagged) | already in `pokes,drc-combo,meaties` | Long active frames, meaty after good knockdowns |
| 2MK (already tagged) | consider adding `meaties` if you use it as one | Meaty low option |
| Step Kick (6MP) | `meaties` (additional tag) | Forward-moving meaty option |
| Light Jinrai (meaty timing) | `meaties,unique` | Plus on block when meaty |

(Decide whether to add `meaties` as a secondary tag to moves already tagged for other reasons. If a move is *primarily* a meaty option, list `meaties` first.)

### Burnout Harassment

| Move | Tags | Why |
|------|------|-----|
| Light Jinrai → KKMK (overhead) | `burnout,unique` | Forces unsafe defense in burnout |
| Light Jinrai → KKLK (low) | `burnout,unique` | Low option in the rekka mixup |
| Run (Quick Dash) → Throw | `burnout` | DR throw alternative, conserves drive |
| Drive Impact (corner) | `burnout` | Corner DI when opponent is in burnout — game-ender |

### DRC Combo

| Move | Tags | Why |
|------|------|-----|
| 2MK DRC (already tagged) | already in `pokes,drc-combo` | The bread-and-butter DRC starter |
| 5HP DRC (already tagged) | already in `pokes,drc-combo,meaties` | Higher-damage DRC starter |
| 2MP DRC | `drc-combo` | Cancelable into DRC for tighter confirms |

### Super Arts Combo

| Move | Tags | Why |
|------|------|-----|
| Dragonlash Flame (SA1, already tagged) | already in `super-arts,super-combo` | Goes in both — it's the SA itself AND the combo destination |
| Shippu Jinrai-Kyaku (SA2, already tagged) | already in `super-arts,super-combo` | Same |
| Shoryuken (already tagged) | already in `anti-airs,super-combo` | Cancel target into super |

### Unique Mechanics

| Move | Tags | Why |
|------|------|-----|
| Jinrai Kick (the rekka itself) | `unique` | The signature Ken mechanic |
| Jinrai → KKMK (Kazekama Shin Kick) | `unique,burnout` (already) | Overhead follow-up |
| Jinrai → KKLK (Senka Snap Kick) | `unique` | Low follow-up |
| Jinrai → KK Stop | `unique,plus-on-block` | The bait/cancel option |
| Run (Quick Dash) | `unique` | Run cancel system base |
| Run → Stop | `unique` | Cancel option |
| Run → Overhead Kick | `unique` | Run mixup option |
| Run → Stepkick | `unique` | Run mixup option |
| Fire Tatsumaki Senpu-Kyaku (after Run) | `unique` | Fire variant — corner carry tool |
| Fire Shoryuken (after Run) | `unique,super-combo` | Fire variant — KD route |
| Fire Dragonlash (after Run) | `unique` | Fire variant — side switch |
| Dragonlash | `unique` | Defining special |
| Tatsumaki Senpu-Kyaku | `unique` | (Optional — debatable whether this is "unique" or generic shoto) |

---

## Things I'm Genuinely Unsure About

Calling these out so you don't take my suggestions as authoritative:

1. **Whether Tatsumaki itself deserves `unique`.** Ryu also has Tatsu, and the L/M/H variants behave differently per character. Maybe it should only be tagged on the Fire variant (which IS Ken-specific via Run cancel). Your call.

2. **Hadoken not tagged anywhere.** Ken's Hadoken isn't a top-tier projectile compared to Ryu's, and it's not signature enough to be `unique`. Probably correct to leave untagged. But if you use OD Hadoken in specific situations regularly, consider `super-combo` or its own slot.

3. **Whether `meaties` should overlap aggressively with `pokes`.** I tagged 5HP with both because it's a meaty option *and* a poke. But if `meaties` should be reserved for moves you *only* use as meaties, drop the overlap. The IA spec is fine with either approach — tags are flexible.

4. **Burnout offense is currently weak in this list.** Real Ken burnout offense involves specific setups (Jinrai loops, corner pressure with run cancels) more than individual moves. The 4 burnout entries above are starting points; you probably know better setups from coaching.

5. **Did not include throws.** Forward throw and back throw aren't in the 9-category model anywhere. They're universal tools. If you want `meaties` to include "DR throw oki," that's a setup, not a move — handle in matchup notes (future feature) rather than tags.

---

## After You Tag Ken

Per the IA spec workflow, the next characters tag in this order — assuming the Ken tagging round validates the workflow:

1. **Terry** (you have decent data per Project files) — tag next, similar effort
2. **Ryu** — straightforward shoto, similar template to Ken
3. **Luke** — your Flash Knuckle / Sand Blast game changes the `super-combo` and `unique` slots significantly
4. **Cammy** — Hooligan + Killer Bee in `unique`, very different burnout game
5. **Chun-Li** — Serenity Stream stance is its own `unique` set
6. **Mai** — boosted special variants change `unique` and `super-combo` substantially

For each: print a fresh worksheet (PDF in `_handoff/05-CHARACTER-WORKSHEET.pdf`), fill by hand during a training session, then transcribe to the Sheet.
