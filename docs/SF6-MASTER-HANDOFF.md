# SF6 Combo Trainer - Master Handoff Document
## Complete Project State & Continuation Guide
**Last Updated:** December 1, 2025
**Version:** 1.0 MVP Complete
**Figma MCP:** ✅ Connected

---

## 🚀 WHAT'S NEXT - PICK ONE TO START

With Figma MCP access, we can now build pixel-perfect designs. Choose your next feature:

| Option | Feature | Description | Effort |
|--------|---------|-------------|--------|
| 🎴 | **Card Redesign** | Purple gradient, 14px white border, City Brawlers font, character art overlay | Large |
| 🎮 | **Combo Viewer** | Horizontal scrolling card rail with swipe navigation | Large |
| 📊 | **Frame Data Badges** | Color-coded Startup/Active/Recovery/Total badges | Medium |
| 🕹️ | **Input Icons** | Visual arrow directions + attack button graphics | Medium |

**Figma File:** https://www.figma.com/design/Bc7305TyPGELiIE4rmwVJe/
**See:** `docs/FIGMA-DESIGN-SYSTEM.md` for full design specs

---

## 🎯 QUICK START FOR NEW CLAUDE SESSION

Upload this document + the `sf6-complete-project.zip` file to continue development.

**To rebuild the project:**
1. Extract `sf6-complete-project.zip` to a new Vite React project
2. Run `npm install` then `npm run dev`
3. The app runs at `localhost:5173`

---

## 📋 PROJECT OVERVIEW

### What This Is
A Street Fighter 6 learning tool focused on **counterplay education** - teaching players what they can do when opponents make mistakes, rather than just listing their own moves.

### Core Philosophy (from Creative Brief)
1. **Opponent-first design** - "What can I do when THEY do X?"
2. **Bidirectional cards** - Flip between your perspective and opponent perspective
3. **Damage-first hierarchy** - Lead with what matters for winning
4. **Active learning** - Not just reference, but study tools

### Target Users
- **Primary:** Plateaued intermediate players (Gold to Diamond rank)
- **Secondary:** Deliberate self-educators who learn by building
- **Tertiary:** Visual learners who hate spreadsheets

---

## 🏆 COMPETITIVE ANALYSIS: vs FullMeter SF6 Trainer

### What FullMeter Has (thanhledesign.com)
1. ✅ Move images with hitbox visualization overlay
2. ✅ Visual input notation (button icons instead of text)
3. ✅ Frame data badges (startup/active/recovery/total)
4. ✅ Links sections by hit type (Normal/Counter/Punish Counter)
5. ✅ Usage descriptions and tactical notes
6. ✅ Combo Viewer feature
7. ✅ Find & Compare tool
8. ✅ Profile/Liked (favorites)
9. ✅ Command List view

### What WE Have That's BETTER
1. ✅ **Video demonstrations** - Moving clips instead of static images
2. ✅ **Bidirectional card flip** - See opponent's perspective (UNIQUE)
3. ✅ **Hit type toggle on cards** - N/CH/PC with live damage updates
4. ✅ **Cross-character search** - Search all 7 characters at once
5. ✅ **Punish Calculator** - Find punishes by frame disadvantage
6. ✅ **Tactical categories** - Neutral/Offensive/Combo/Corner organization
7. ✅ **Mobile-first responsive** - 2-column compact view on mobile
8. ✅ **Dark theme** - Better for late-night labbing

### What We Should ADD (Feature Gap)
1. ❌ **Hitbox visualization** - Overlay on videos/images
2. ❌ **Visual input icons** - Button graphics instead of "LP", "HP"
3. ❌ **Combo Viewer** - Chain moves together, see total damage
4. ❌ **Find & Compare** - Side-by-side move comparison
5. ❌ **Favorites/Liked** - Save moves to personal collection
6. ❌ **Flash Card Study Mode** - Quiz-based learning (PLANNED)
7. ❌ **Pressure String Database** - Multi-move sequences (PLANNED)

---

## ✅ COMPLETED WORK

### Phase 1: Foundation & UI
- [x] React + Vite + Tailwind project setup
- [x] Character card selection UI with hover animations
- [x] React Router integration
- [x] Sticky navigation with hamburger menu (mobile)
- [x] Floating search dropdown
- [x] Character selector modal in nav
- [x] Scroll-to-top on navigation

### Phase 2: Character Data (538 Total Moves)
| Character | Moves | Special Mechanics |
|-----------|-------|-------------------|
| Ken | 76 | Jinrai rekkas, Dragonlash, Run |
| Terry | 67 | Burn Knuckle, Power Dunk, Quick Burn |
| Chun-Li | 78 | Serenity Stream stance (9 moves) |
| Luke | 77 | Flash Knuckle charge/perfect release |
| Cammy | 75 | Hooligan stance, Killer Bee Spin |
| Mai | 90 | Boosted special variants (46 specials!) |
| Ryu | 75 | Denjin Charge system |

### Phase 3: Move Cards
- [x] Flippable cards (your perspective ↔ opponent perspective)
- [x] Hit type toggle (Normal/Counter Hit/Punish Counter)
- [x] Frame data display (Startup/Active/Recovery/Total)
- [x] Frame advantage display (On Block/On Hit)
- [x] Properties tags (High/Low, Cancelable, Armor, etc.)
- [x] Links sections by hit type
- [x] Video/image support with play button overlay
- [x] Compact card mode (2-column mobile)

### Phase 4: Navigation & Mobile UX
- [x] Hamburger menu (mobile only)
- [x] Floating search with dropdown
- [x] Character selector modal
- [x] Alphabetical character sorting
- [x] 2-column compact view toggle
- [x] Default compact on mobile, full on desktop
- [x] Sticky category subnav
- [x] Z-index hierarchy (nav > subnav > content)

### Phase 5: Components
- [x] MoveBrowser - Browse by tactical category
- [x] SearchResults - Cross-character search
- [x] PunishCalculator - Find punishes by frame data
- [x] CharacterCards - Character selection grid
- [x] MoveCard - Full flippable card component

---

## 📁 FILE STRUCTURE

```
sf6-combo-trainer/
├── public/
│   └── videos/
│       ├── ken/
│       │   ├── shoryuken.mp4
│       │   ├── shoryuken_od.mp4
│       │   ├── jinrai_l.mp4
│       │   ├── jinrai_l_followup.mp4
│       │   ├── jinrai_od.mp4
│       │   ├── jinrai_od_followup.mp4
│       │   ├── chin_buster.mp4
│       │   ├── quick_dash.mp4
│       │   ├── quick_dash_stop.mp4
│       │   ├── cancel_drive_rush.mp4
│       │   ├── parry_drive_rush.mp4
│       │   └── sa3.mp4
│       └── terry/
│           ├── burn_knuckle_m_followup.mp4
│           └── burn_knuckle_od.mp4
├── src/
│   ├── assets/
│   │   └── characters/
│   │       ├── kenThumbnail.png
│   │       ├── terryThumbnail.png
│   │       ├── chunliThumbnail.png
│   │       ├── lukeThumbnail.png
│   │       ├── cammyThumbnail.png
│   │       ├── maiThumbnail.png
│   │       └── ryuThumbnail.png
│   ├── components/
│   │   ├── Browse/
│   │   │   └── MoveBrowser.jsx
│   │   ├── Card/
│   │   │   └── MoveCard.jsx
│   │   ├── Punish/
│   │   │   └── PunishCalculator.jsx
│   │   ├── Search/
│   │   │   └── SearchResults.jsx
│   │   └── CharacterCards.jsx
│   ├── data/
│   │   └── characters/
│   │       ├── index.js
│   │       ├── ken.json
│   │       ├── terry.json
│   │       ├── chunli.json
│   │       ├── luke.json
│   │       ├── cammy.json
│   │       ├── mai.json
│   │       └── ryu.json
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🎨 DESIGN SYSTEM

### Colors (Tailwind)
| Usage | Class |
|-------|-------|
| Background | `bg-gray-900` |
| Cards/Nav | `bg-gray-800` |
| Borders | `border-gray-700` |
| Primary accent | `purple-600` |
| Safe moves | `green-500` |
| Risky moves | `red-500` |
| Warning | `yellow-500` |

### Z-Index Hierarchy
| Element | Z-Index |
|---------|---------|
| Main nav | `z-50` |
| Search dropdown | `z-[60]` |
| Page sticky subnav | `z-40` |
| Modals | `z-50` |
| Card dropdowns | `z-50` |

### Breakpoints
| Name | Width | Usage |
|------|-------|-------|
| Mobile | 0-767px | 2-col compact default |
| Tablet | 768px+ | Full cards |
| Desktop | 1024px+ | 3-4 column grids |

### Sticky Nav Positioning
- Main nav: `sticky top-0`
- Page subnav: `fixed top-[75px]`

---

## 📊 DATA SCHEMA

### Character JSON Structure
```json
{
  "character": {
    "id": "ken",
    "name": "Ken Masters",
    "displayName": "Ken",
    "archetype": "rushdown",
    "description": "...",
    "version": "1.0.0"
  },
  "tactics": {
    "neutral": { "name": "...", "moveIds": [...] },
    "offensive": { ... },
    "combo": { ... },
    "corner": { ... }
  },
  "moves": {
    "ken_st_hp": {
      "id": "ken_st_hp",
      "displayName": "Standing Heavy Punch",
      "shortName": "5HP",
      "input": "HP",
      "category": "normal",
      "damage": 800,
      "yourPerspective": {
        "tacticalUse": "...",
        "whenToUse": "...",
        "situations": ["neutral", "punish"],
        "connectsTo": ["ken_hadoken_l", ...]
      },
      "opponentPerspective": {
        "frameAdvantage": { "onBlock": -2, "onHit": 2 },
        "riskLevel": "safe",
        "riskDescription": "..."
      },
      "frameData": {
        "startup": 8,
        "active": 3,
        "recovery": 18,
        "total": 29
      },
      "properties": {
        "hitLevel": "high",
        "cancelable": true
      },
      "linksOnNormal": [...],
      "linksOnCounter": [...],
      "linksOnPunishCounter": [...],
      "video": "/videos/ken/st_hp.mp4"
    }
  }
}
```

---

## 🚀 DEVELOPMENT ROADMAP

### Tier 1 - HIGH PRIORITY (Next Sprint)

#### 1. Flash Card Study Mode
- Quiz-based learning with multiple choice
- Show opponent move → pick correct punish
- Spaced repetition algorithm
- Progress tracking ("15 situations mastered")

#### 2. Pressure String Database
- Document common multi-move sequences
- Example: "Ryu 2MK > 236HK" - Safe if spaced, PC if close
- Show gaps, counterplay options, option selects
- **User feedback explicitly requested this**

#### 3. Opponent Move Database ("vs Mode")
- Browse opponent's unsafe moves
- See YOUR character's punish options
- Matchup preparation mode

### Tier 2 - MEDIUM PRIORITY

#### 4. Favorites/Bookmarks
- Star icon on cards
- localStorage for now
- Personal study deck

#### 5. Search Filters
- Filter by frame data (plus, minus, punishable)
- Filter by properties (low, overhead, armor)
- Filter by character

#### 6. Compare Tool
- Side-by-side move comparison
- Compare across characters

### Tier 3 - FUTURE

#### 7. Combo Builder
- Chain moves together
- Calculate total damage with scaling
- Track meter cost

#### 8. Visual Enhancements
- Hitbox visualization
- Visual input icons (button graphics)
- More video demonstrations

#### 9. More Characters
- ~2 hours per character with PDF
- Target: Full SF6 roster (28+ characters)

---

## 🐛 KNOWN ISSUES / LIMITATIONS

1. **No backend** - All client-side, localStorage only
2. **No user accounts** - Can't sync across devices
3. **Static data** - Manual updates for patches
4. **English only** - No i18n
5. **No offline mode** - Could add PWA support

---

## 👤 USER FEEDBACK (Matt from Discord)

> "I think the hard part about just frame data is it's not obvious what the actual mixup is. Like yeah if Ken is doing jinrai i can DI, but the mix is whether you do diff versions and you have time to counter DI."

> "I need shit like sajam or chrisF videos that tell you what the mix is and whether there's an option select that beats it"

> "I think once the baseline is in, next level is to include the common strings and sequences."

**Key Insight:** Frame data alone isn't enough. Users need to understand the MIXUP and COUNTERPLAY, not just numbers.

---

## 🔧 TECHNICAL NOTES

### Dependencies
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "lucide-react": "latest",
  "tailwindcss": "^3.x",
  "vite": "^5.x"
}
```

### Key Implementation Details

**Card Height Matching:**
```jsx
// Each card measures its own height, applies to both sides
const [cardHeight, setCardHeight] = useState(null);
useEffect(() => {
  if (frontRef.current) {
    setCardHeight(frontRef.current.offsetHeight);
  }
}, [move, hitType]);
```

**Mobile Default Compact:**
```jsx
const [mobileColumns, setMobileColumns] = useState(() => {
  return window.innerWidth < 768 ? 2 : 1;
});
```

**Video Tap-to-Play (Mobile):**
```jsx
const handleMediaClick = (e) => {
  e.stopPropagation();
  if (videoRef.current && mediaType === 'video') {
    setIsHovering(true); // Hide play overlay immediately
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      setIsHovering(false);
    }
  }
};
```

---

## 📝 SESSION LOG

### November 29-30, 2025
- Initial project setup
- Added 7 characters (538 moves)
- Built core card system with flip animation
- Hit type toggle (N/CH/PC)
- Cross-character search
- Punish Calculator

### November 30, 2025 (Extended Session)
- Navigation redesign (hamburger, floating search)
- Character selector modal
- Mobile responsive overhaul
- 2-column compact view
- Sticky subnav fixes
- Z-index hierarchy fixes
- Video tap-to-play fix
- Default compact on mobile

---

## 📦 INCLUDED FILES

The `sf6-complete-project.zip` contains:
1. All source code (src/)
2. All character data JSONs
3. All character thumbnails
4. All video demonstrations
5. Tailwind config
6. Vite config
7. Package.json

---

## 🎬 TO CONTINUE DEVELOPMENT

1. Upload this document to new chat
2. Upload `sf6-complete-project.zip`
3. Tell Claude: "I'm continuing the SF6 Combo Trainer project. Please extract the zip and review the handoff document."
4. Specify what feature you want to work on next

**Recommended next feature:** Pressure String Database (user explicitly requested)

---

*This document was generated to ensure continuity across Claude sessions.*
