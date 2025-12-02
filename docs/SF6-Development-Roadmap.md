# SF6 Combo Trainer - Development Roadmap
## Strategic Plan & Feature Priorities

*Created: November 30, 2025*
*Last Updated: December 1, 2025*
*Project Status: MVP Complete (7 characters, 538 moves)*
*Figma Connected: ✅ Full MCP Access*

---

## 🚀 WHAT'S NEXT - PICK ONE TO START

With Figma MCP access, we can now build pixel-perfect designs. Choose your next feature:

| Option | Feature | Description | Effort |
|--------|---------|-------------|--------|
| 🎴 | **Card Redesign** | Purple gradient, 14px white border, City Brawlers font, character art overlay | Large (4-6 hrs) |
| 🎮 | **Combo Viewer** | Horizontal scrolling card rail with swipe navigation | Large (4-6 hrs) |
| 📊 | **Frame Data Badges** | Color-coded Startup/Active/Recovery/Total badges | Medium (2-3 hrs) |
| 🕹️ | **Input Icons** | Visual arrow directions + attack button graphics | Medium (2-3 hrs) |

### Recommended Order:
1. **📊 Frame Data Badges** ← Quick win, visible improvement
2. **🕹️ Input Icons** ← Better UX, prep for combos
3. **🎴 Card Redesign** ← Full visual overhaul
4. **🎮 Combo Viewer** ← New major feature

### To Continue Development:
```
Tell Claude: "Let's work on [OPTION] from the roadmap"
```

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
- Mobile hamburger menu
- 2-column compact view

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

## 🎨 FIGMA-POWERED DESIGN PHASE (NEW - HIGH PRIORITY)

*Figma File: https://www.figma.com/design/Bc7305TyPGELiIE4rmwVJe/*
*MCP Access: Connected December 1, 2025*
*User Preferences: Captured December 1, 2025*

---

### 📋 USER DESIGN DECISIONS (Dec 1, 2025)

#### ✅ KEEP AS-IS (No Changes)
- **Navigation:** Hamburger menu, logo, floating search, character avatar
- **Character Selection:** Modal popup, 2x4 grid, thumbnails, names
- **Browse Page:** Category tabs, sticky nav, responsive grid, compact toggle
- **Colors:** Dark bg (gray-900), purple accent, green=safe, red=unsafe
- **Card Elements:** Video/image, move name, hit type toggle, properties tags, flip animation

#### 🔄 CHANGE (Card Styling Only)
| Element | Current | Change To |
|---------|---------|-----------|
| Card background | Dark gray (gray-800) | **Purple gradient** |
| Card border | Thin gray | **Gradient based on card component** |
| Frame data | Plain text grid | **Color-coded badges** |
| Links section | On front | **Move to back side only** |

---

### Phase F0: Wireframes & User Flows 📐
**Priority: USER ACTION REQUIRED**
**Status:** ⏳ Waiting for user to create in Figma

| Task | Status | Owner | Description |
|------|--------|-------|-------------|
| F0.1 Site navigation flow | ⏳ WAITING | User | How pages connect |
| F0.2 Move detail page wireframe | ⏳ WAITING | User | Full-screen template |
| F0.3 Combo viewer flow | ⏳ WAITING | User | Horizontal scroll UX |
| F0.4 Study mode wireframe | ⏳ WAITING | User | Flash card quiz flow |

**Note:** User will create wireframes in Figma. Claude will pull via MCP and implement.

---

### Phase F1: Card Redesign 🎴
**Priority: CRITICAL** - Foundation for all other UI work

| Task | Status | Description |
|------|--------|-------------|
| F1.1 Purple gradient background | ⬜ TODO | `#200147` → `#2e0549` gradient |
| F1.2 Gradient border | ⬜ TODO | Based on card component design |
| F1.3 Keep existing layout | ✅ DONE | Video, name, toggle, properties, flip |
| F1.4 Move links to back side | ⬜ TODO | Front = clean, Back = details + links |

**Figma Reference:** Node `1217:22251` (Ken 2HP Card)

---

### Phase F2: Frame Data Badges 📊
**Priority: HIGH** - Visual improvement, quick win

| Task | Status | Description |
|------|--------|-------------|
| F2.1 Startup badge (teal) | ⬜ TODO | `#03b594` background |
| F2.2 Active badge (pink) | ⬜ TODO | `#c92b66` background |
| F2.3 Recovery badge (blue) | ⬜ TODO | `#016ebc` background |
| F2.4 Total badge (black) | ⬜ TODO | `#0d0d0d` background |
| F2.5 Cancelable badge (green) | ⬜ TODO | `#007724` background |
| F2.6 Hit type toggle (N/CH/PC) | ⬜ TODO | With emoji icons 👊🙅 |

**Figma Reference:** Frame data row in card designs

---

### Phase F3: Input Notation Icons 🕹️
**Priority: HIGH** - Major UX improvement

| Task | Status | Description |
|------|--------|-------------|
| F3.1 Arrow components (10 dirs) | ⬜ TODO | ↓↑←→↖↗↙↘ + dashes |
| F3.2 Arrow size variants | ⬜ TODO | XS, Sm, Md, Lg |
| F3.3 Attack button icons | ⬜ TODO | LP, MP, HP, LK, MK, HK |
| F3.4 Special buttons | ⬜ TODO | DI, Parry, ANY |
| F3.5 Connector symbols | ⬜ TODO | +, → components |
| F3.6 Active/Inactive states | ⬜ TODO | Color vs gray |

**Figma Reference:** Nodes `1112:22432` (arrows), `1:1260` (buttons)

---

### Phase F4: Combo Viewer 🎮
**Priority: HIGH** - New major feature (user requested!)

| Task | Status | Description |
|------|--------|-------------|
| F4.1 Horizontal card rail | ⬜ TODO | Scrollable card container |
| F4.2 Card spacing (32px) | ⬜ TODO | Gap between cards |
| F4.3 Prev/Next tap areas | ⬜ TODO | 120px/128px touch targets |
| F4.4 Swipe navigation | ⬜ TODO | Touch gesture support |
| F4.5 Pagination component | ⬜ TODO | "← PREV | 2 of 3 | NEXT →" |
| F4.6 Restart button | ⬜ TODO | Loop icon at end of rail |
| F4.7 Combo data structure | ⬜ TODO | JSON schema for combos |

**Figma Reference:** Node `1112:26705` (Simple Punish Combo)

---

### Phase F5: Design Polish 🎨
**Priority: MEDIUM** - Final touches

| Task | Status | Description |
|------|--------|-------------|
| F5.1 Meter usage display | ⬜ TODO | Drive gauge + SA boxes |
| F5.2 Hit level icons | ⬜ TODO | 3-tier block (High/Mid/Low) |
| F5.3 Vitals bar | ⬜ TODO | "HP: 10,000 HT: 5'9 WT: 183" |
| F5.4 Extract color variables | ⬜ TODO | Tailwind config update |
| F5.5 Hitbox visualization | ⬜ TODO | Green overlay on images |

---

## 📚 LEARNING FEATURES PHASE

### Phase L1: Flash Card Study Mode
**Priority: HIGH** - Core learning feature

| Task | Status | Description |
|------|--------|-------------|
| L1.1 Quiz UI component | ⬜ TODO | Multiple choice format |
| L1.2 Question generator | ⬜ TODO | "What punishes this?" |
| L1.3 Answer validation | ⬜ TODO | Correct/incorrect feedback |
| L1.4 Spaced repetition | ⬜ TODO | SM-2 algorithm |
| L1.5 Progress tracking | ⬜ TODO | "15 situations mastered" |
| L1.6 localStorage persistence | ⬜ TODO | Save progress locally |

---

### Phase L2: Pressure String Database
**Priority: HIGH** - User explicitly requested (Matt)

| Task | Status | Description |
|------|--------|-------------|
| L2.1 String data schema | ⬜ TODO | JSON structure for sequences |
| L2.2 Gap information | ⬜ TODO | Is it true? Frame gaps? |
| L2.3 Spacing context | ⬜ TODO | "Safe if spaced, PC if close" |
| L2.4 Counterplay options | ⬜ TODO | DI timing, interrupts |
| L2.5 Option select docs | ⬜ TODO | "OS that beats multiple options" |
| L2.6 String browser UI | ⬜ TODO | List/filter common strings |

---

### Phase L3: Opponent Move Database (vs Mode)
**Priority: HIGH** - Core counterplay feature

| Task | Status | Description |
|------|--------|-------------|
| L3.1 Matchup selector | ⬜ TODO | "Ken vs Terry" UI |
| L3.2 Unsafe moves list | ⬜ TODO | Organized by frame disadvantage |
| L3.3 Punish recommendations | ⬜ TODO | Your options for each move |
| L3.4 Filter by frame data | ⬜ TODO | -6 or worse, -10 or worse |

---

### Phase L4: Favorites/Bookmarks
**Priority: MEDIUM** - Quality of life

| Task | Status | Description |
|------|--------|-------------|
| L4.1 Star icon on cards | ⬜ TODO | Toggle favorite |
| L4.2 Favorites list view | ⬜ TODO | Quick access page |
| L4.3 localStorage save | ⬜ TODO | Persist between sessions |
| L4.4 Export/import | ⬜ TODO | JSON backup |

---

## 🔧 TECHNICAL IMPROVEMENTS

### Phase T1: Search & Filter
| Task | Status | Description |
|------|--------|-------------|
| T1.1 Frame data filters | ⬜ TODO | Plus, minus, punishable |
| T1.2 Property filters | ⬜ TODO | Low, overhead, armor |
| T1.3 Character filter | ⬜ TODO | Narrow to specific character |
| T1.4 Search persistence | ⬜ TODO | Remember last search |

### Phase T2: Performance
| Task | Status | Description |
|------|--------|-------------|
| T2.1 Code splitting | ⬜ TODO | Route-based lazy loading |
| T2.2 Image optimization | ⬜ TODO | WebP, responsive srcset |
| T2.3 PWA offline support | ⬜ TODO | Service worker |
| T2.4 Virtual scrolling | ⬜ TODO | For large move lists |

---

## 📊 Success Metrics

### Immediate (MVP) ✅
- [x] User can find punish in <30 seconds
- [x] All 7 characters load correctly
- [x] Search returns relevant results

### Design Phase (F1-F5)
- [ ] Cards match Figma design 95%+
- [ ] Input notation is visual, not text
- [ ] Frame data is color-coded

### Learning Phase (L1-L4)
- [ ] 50%+ retention on quiz after 24 hours
- [ ] Users report landing more punishes
- [ ] Average 3+ sessions per week

---

## 🗓️ Suggested Order of Work

### Sprint 1: Visual Foundation
1. **F1: Card Redesign** - Make it look like Figma
2. **F2: Frame Data Badges** - Quick visual win

### Sprint 2: Input System
3. **F3: Input Icons** - Arrows and buttons
4. **F5: Design Polish** - Remaining visual elements

### Sprint 3: Combo Feature
5. **F4: Combo Viewer** - Horizontal scrolling
6. **L2: Pressure Strings** - Matt's request

### Sprint 4: Learning
7. **L1: Flash Cards** - Study mode
8. **L3: vs Mode** - Matchup prep

### Sprint 5: Polish
9. **L4: Favorites** - Bookmarks
10. **T1: Filters** - Better search

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Nov 29 | Start with Ken, Terry, Chun-Li | Most popular characters |
| Nov 30 | Add Luke, Cammy, Mai, Ryu | Complete core roster |
| Nov 30 | Prioritize Pressure Strings | User feedback (Matt) |
| Nov 30 | Defer video integration | Focus on core learning loop |
| Dec 1 | Connect Figma MCP | Enable pixel-perfect design |
| Dec 1 | Prioritize Card Redesign | Foundation for all UI |

---

## 🔗 Resources

### Figma
- **File:** https://www.figma.com/design/Bc7305TyPGELiIE4rmwVJe/
- **Prototypes Canvas:** Node `1112:28495`
- **Card Design:** Node `1217:22251`
- **Combo Viewer:** Node `1112:26705`

### Deployment
- **Vercel:** https://vercel.com/thanh-les-projects-f5b2fa8b/sf6-combo-trainer
- **Live Site:** https://sf6-combo-trainer.vercel.app
- **GitHub:** https://github.com/thanhledesign/sf6-combo-trainer

---

*Last updated: December 1, 2025*
*Next review: After Phase F1-F2 completion*
