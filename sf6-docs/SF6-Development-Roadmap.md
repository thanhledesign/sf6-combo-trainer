# SF6 Combo Trainer - Development Roadmap
## Strategic Plan & Feature Priorities

*Created: November 30, 2025*
*Project Status: MVP Complete (7 characters, 538 moves)*

---

## Vision Statement

Transform fighting game learning from passive reference lookup into **active counterplay education**. Build a tool that teaches players to recognize and capitalize on opponent mistakes by presenting frame data through the lens of situational decision-making.

**Core Philosophy:**
- Opponent-first design (what can I do when THEY do X?)
- Bidirectional information (your perspective + opponent perspective)
- Damage-first hierarchy (lead with what matters for winning)
- Active learning over passive reference

---

## Current State (v1.0 - MVP)

### ✅ Completed Features:
- Character selection UI with 7 characters
- Flippable move cards (your/opponent perspective)
- Move browser by tactical category
- Cross-character search
- Basic punish calculator
- Sticky navigation
- Scroll-to-top on navigation

### ✅ Character Data:
| Character | Moves | Special Mechanics |
|-----------|-------|-------------------|
| Ken | 76 | Jinrai rekkas, Dragonlash |
| Terry | 67 | Burn Knuckle, Power Dunk |
| Chun-Li | 78 | Serenity Stream stance |
| Luke | 77 | Flash Knuckle charge/perfect |
| Cammy | 75 | Hooligan stance, Killer Bee |
| Mai | 90 | Boosted special variants |
| Ryu | 75 | Denjin Charge system |

---

## Roadmap Phases

### Phase 2: Core Learning Features (HIGH PRIORITY)
*Target: Next development sprint*

#### 2.1 Pressure String Database (NEW - from user feedback)
**Priority: CRITICAL** - Matt explicitly requested this

**Description:** Document common multi-move sequences with counterplay
- Example: "Ryu 2MK > 236HK" - Safe if spaced, PC if close
- Show: Is it true? Gaps? Spacing dependent?
- Show: Counterplay options (DI timing, interrupt points)
- Show: Option selects that beat multiple options

**Data structure addition:**
```json
"pressureStrings": {
  "ryu_2mk_donkey": {
    "sequence": ["ryu_2mk", "ryu_high_blade_kick_h"],
    "isTrue": false,
    "gap": 3,
    "spacingDependent": true,
    "counterplay": ["DI (timing dependent)", "4f normal if close"],
    "notes": "Safe if spaced, punishable if too close"
  }
}
```

**MVP scope:** 5-10 strings per character

---

#### 2.2 Opponent Move Database
**Priority: HIGH**

**Description:** "vs Terry" mode showing YOUR options against opponent moves
- Browse opponent's minus moves
- See your punish options for each
- Filter by frame disadvantage
- Matchup preparation mode

**UI Flow:**
1. Select your character (Ken)
2. Select opponent character (Terry)
3. See Terry's unsafe moves organized by frame disadvantage
4. Tap any move to see Ken's punish options

---

#### 2.3 Flash Card Study Mode
**Priority: HIGH**

**Description:** Quiz-based learning with spaced repetition
- Show opponent move, hide frame data
- Multiple choice: pick correct punish
- Right/wrong feedback with explanations
- Track mastery over time
- Spaced repetition algorithm

**Mechanics:**
- New cards shown frequently
- Mastered cards shown less often
- "Mastery" = 3 correct in a row with increasing intervals
- Progress tracking: "You've mastered 15 punish situations"

---

#### 2.4 Bookmark/Favorites System
**Priority: MEDIUM**

**Description:** Save moves to personal study deck
- Star icon on any card
- Favorites list accessible from nav
- LocalStorage (no account needed)
- Export/import favorites (JSON)

---

### Phase 3: Enhanced UX (MEDIUM PRIORITY)
*Target: Post-Phase 2*

#### 3.1 Search Filters
- Filter by character
- Filter by category (normal, special, super)
- Filter by frame advantage (plus, minus, punishable)
- Filter by properties (low, overhead, armor, projectile)

#### 3.2 Risk Assessment Warnings
- More prominent styling for unsafe moves
- Color coding: Green (safe) → Yellow (risky) → Red (death)
- "MINUS 40 - DEATH ON BLOCK" warning banners
- Visual indicators on card previews

#### 3.3 Mobile Optimization
- Touch-friendly card interactions
- Swipe to flip cards
- Bottom navigation for thumb access
- Offline support (PWA)

---

### Phase 4: Advanced Features (LOWER PRIORITY)
*Target: Future iterations*

#### 4.1 Combo Builder
- Chain moves together
- See total damage with scaling
- Meter cost tracking
- Save custom combos

#### 4.2 Video/GIF Integration
- Embed move demonstrations
- Link to Sajam/ChrisF videos for concepts
- Training mode recording integration (future)

#### 4.3 Community Features
- Share saved combos/strings
- User-submitted pressure strings
- Upvote/verify community data
- Requires backend/accounts

#### 4.4 More Characters
- Workflow is established (~2 hours per character with PDF)
- Prioritize popular/requested characters
- Target: Full roster eventually

---

## Success Metrics

### Immediate (MVP)
- [ ] User can find punish in <30 seconds
- [ ] All 7 characters load correctly
- [ ] Search returns relevant results

### Learning (Phase 2)
- [ ] 50%+ retention on quiz after 24 hours
- [ ] Users report landing more punishes
- [ ] Average 3+ sessions per week for active users

### Growth (Phase 3+)
- [ ] 7-day return rate >40%
- [ ] Organic sharing on social/Discord
- [ ] Community contributions

---

## Technical Debt & Improvements

### Data Quality
- [ ] Verify all frame data against latest patch
- [ ] Add missing move properties (armor frames, invincibility)
- [ ] Standardize damage values for combos

### Code Quality
- [ ] Add TypeScript for type safety
- [ ] Component testing
- [ ] Performance optimization for large datasets

### Infrastructure
- [ ] CI/CD pipeline
- [ ] Error tracking (Sentry)
- [ ] Analytics (usage patterns)

---

## Resource Estimates

| Phase | Features | Estimated Time |
|-------|----------|----------------|
| Phase 2.1 | Pressure Strings | 8-12 hours |
| Phase 2.2 | Opponent Move DB | 6-8 hours |
| Phase 2.3 | Flash Cards | 10-15 hours |
| Phase 2.4 | Bookmarks | 3-4 hours |
| Phase 3 | UX Enhancements | 15-20 hours |
| Phase 4 | Advanced Features | 40+ hours |

**Note:** These are AI-assisted development estimates. Traditional agency would be 3-5x longer.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Nov 29 | Start with Ken, Terry, Chun-Li | Most popular characters |
| Nov 30 | Add Luke, Cammy, Mai, Ryu | Complete core roster |
| Nov 30 | Prioritize Pressure Strings | User feedback (Matt) |
| Nov 30 | Defer video integration | Focus on core learning loop |

---

## Open Questions

1. **Backend needed?** Currently all client-side. Backend enables:
   - User accounts
   - Cloud sync
   - Community features
   - But adds complexity/cost

2. **Monetization?** Options:
   - Free forever (passion project)
   - Donations/Patreon
   - Premium features (unlikely - keep learning free)

3. **Full roster priority?** 
   - Current: 7 characters
   - Full SF6 roster: 28+ characters
   - Add on request or full coverage?

---

*Last updated: November 30, 2025*
*Next review: After Phase 2 completion*
