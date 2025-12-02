# SF6 Combo Trainer - Figma Design System
## Design Specifications from Figma Source

**Last Updated:** December 1, 2025
**Figma File:** https://www.figma.com/design/Bc7305TyPGELiIE4rmwVJe/Street-Fighter-6-%E2%80%94TLE-App

---

## 🎨 Color System

### Card Background Gradient
```css
/* Purple gradient - Normal Moves card */
background: linear-gradient(180deg, #200147 0%, #2e0549 100%);

/* Overlay - Character artwork at 40% opacity */
/* Plus hue blend layer */
background: linear-gradient(180deg, #240259 0%, #2d0446 100%);
mix-blend-mode: hue;
```

### Frame Data Colors
| Element | Color | Hex |
|---------|-------|-----|
| Startup | Teal/Green | `#03b594` |
| Active | Pink/Red | `#c92b66` |
| Recovery | Blue | `#016ebc` |
| Total | Black | `#0d0d0d` |
| Cancelable | Green | `#007724` |

### Meter Indicators
| Type | Border Color |
|------|--------------|
| Drive Gauge (empty) | `#00dd55` |
| Drive Gauge (filled) | `#00dd55` solid |
| Super Art (empty) | `#ff0062` |
| Super Art (filled) | `#ff0062` solid |

### Text Colors
| Usage | Color |
|-------|-------|
| Primary (headings) | `#ffffff` |
| Secondary | `#f0f0f0` |
| Muted | `#f4f4f4` |
| On Block (positive) | `#ffffff` on light bg |
| On Block (negative) | `#ffffff` on dark bg |

---

## 📐 Card Specifications

### Move Card Dimensions
- **Width:** 512px
- **Height:** 714px
- **Border:** 14px solid white
- **Border Radius:** 24px
- **Padding:** 32px horizontal, 40px vertical
- **Shadow:** `0px 4px 16px rgba(46, 5, 73, 0.3)`

### Card Structure (Top to Bottom)
1. **Header Row** - Character name + Damage
2. **Image Area** - 16:9 aspect ratio, border `#777777`
3. **Vitals Bar** - Purple bg `#210c62`, "HP: 10,000 HT: 5'9 WT: 183 lbs"
4. **Move Name Row** - Meter usage + Move name
5. **Command Row** - Input notation with icons
6. **Property Row** - Hit level icon + Description text
7. **Perks** - 3-column bullet points
8. **Frame Data Row** - Badges + Hit/Block data

---

## 🔤 Typography

### Font Families
| Usage | Font | Weight |
|-------|------|--------|
| Character Name | City Brawlers | Bold Caps |
| Button Text | City Brawlers | Bold Caps |
| Damage Numbers | Inter | Bold |
| Move Names | Inter | Bold |
| Descriptions | Inter | Regular |
| Frame Numbers | Inter | Bold |

### Font Sizes
| Element | Size |
|---------|------|
| Character Name (KEN) | 64px, tracking: 1.92px |
| Damage Number | 36px, tracking: -1.44px |
| "DMG" Label | 24px |
| Move Name | 24px |
| Description | 14px |
| Perks (bullet points) | 10px |
| Vitals | 10px |
| Frame Data Numbers | 24px |
| Arrow Labels | 8px |

---

## 🎮 Input Notation Components

### Arrow Icons
Available directions:
- Down (2)
- Up (8)
- Left (4)
- Right (6)
- Up-Left (7)
- Down-Left (1)
- Up-Right (9)
- Down-Right (3)
- Dash-Forward (66)
- Dash-Backwards (44)

### Arrow Sizes
| Size | Usage |
|------|-------|
| XS | Compact displays |
| Sm | Card command row |
| Md | Medium displays |
| Lg | Large displays |

### Attack Buttons
States: Active (colored) / Inactive (gray)

| Button | Active Color |
|--------|--------------|
| LP | Light color scheme |
| MP | Medium color scheme |
| HP | Heavy color scheme |
| LK | Light color scheme |
| MK | Medium color scheme |
| HK | Heavy color scheme |
| Drive Impact | Special color |
| Parry | Special color |
| ANY Punch | Generic punch |
| ANY Kick | Generic kick |

### Connector Symbols
- `+` - Simultaneous input
- `→` - Link/chain (32px Inter Black)

---

## 📊 Frame Data Badges

### Badge Structure
```jsx
<div className="border-2 border-white rounded-[4px] flex">
  <div className="bg-[#03b594] border-2 border-black p-2 rounded-[4px]">
    <span className="text-white font-bold text-[24px]">8</span>
  </div>
  <div className="bg-[#c92b66] border-2 border-black p-2 rounded-[4px]">
    <span className="text-white font-bold text-[24px]">4</span>
  </div>
  <div className="bg-[#016ebc] border-2 border-black p-2 rounded-[4px]">
    <span className="text-white font-bold text-[24px]">24</span>
  </div>
  <div className="bg-[#0d0d0d] border-2 border-black p-2 rounded-[4px]">
    <span className="text-white font-bold text-[24px]">35</span>
  </div>
</div>
```

### Recovery Data Structure
```jsx
<div className="bg-white/20 p-[2px] rounded-[4px] flex gap-2">
  {/* Hit Type (N/CH/PC) */}
  <div className="bg-black border-2 border-[#d1d1d1] p-2 rounded-[4px]">
    <span className="text-white font-bold text-[24px]">N</span>
  </div>
  {/* On Hit */}
  <div className="bg-neutral-200 border-2 border-black p-2 rounded-[4px]">
    <span className="text-black font-bold text-[24px]">👊+3</span>
  </div>
  {/* On Block */}
  <div className="bg-[#373737] border-2 border-black p-2 rounded-[4px]">
    <span className="text-white font-bold text-[24px]">🙅🏻‍♂️-10</span>
  </div>
  {/* Cancelable */}
  <div className="bg-[#007724] border-2 border-black p-2 rounded-[4px]">
    <span className="text-white font-bold text-[24px]">C</span>
  </div>
</div>
```

---

## 🎯 Hit Level Property Icon

### Three-Tier Block Design
```jsx
// High hit - top block dark, middle/bottom gray
<div className="flex flex-col w-[33px]">
  <div className="h-[11px] bg-[#272727] border border-[#f4f4f4]" />
  <div className="h-[11px] bg-[#7f7f7f] border border-[#f4f4f4]" />
  <div className="h-[11px] bg-[#7f7f7f] border border-[#f4f4f4]" />
</div>

// Mid hit - middle block dark
// Low hit - bottom block dark
```

---

## 📱 Combo Viewer Layout

### Screen Structure
```
┌─────────────────────────────────────┐
│ KEN                                 │  Header
│ Simple Punish Combo                 │  Subtitle
│ Swipe or Tap Left/Right to scroll   │  Instructions
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │  Card Rail
│ │Card1│ │Card2│ │Card3│ │Card4│ ↻  │  (horizontal scroll)
│ └─────┘ └─────┘ └─────┘ └─────┘    │
├─────────────────────────────────────┤
│ ← PREV COMBO   2 of 3   NEXT COMBO →│  Pagination
└─────────────────────────────────────┘
```

### Card Rail Specifications
- **Card spacing:** 32px gap
- **Prev/Next tap areas:** 120px / 128px
- **Restart icon:** 120x120px at end of rail

### Pagination
- Height: 102px
- Width: Full width (628px)
- Typography: City Brawlers font

---

## 🎴 Meter Usage Display

### Drive Gauge Boxes (6 boxes)
```jsx
// Empty box
<div className="w-[8px] h-[8px] border border-[#00dd55] rounded-[2px]" />

// Filled box
<div className="w-[8px] h-[8px] bg-[#00dd55] border border-[#00dd55] rounded-[2px]" />
```

### Super Art Boxes (3 boxes, wider)
```jsx
// Empty box
<div className="w-[18px] h-[8px] border border-[#ff0062] rounded-[2px]" />

// Filled box
<div className="w-[18px] h-[8px] bg-[#ff0062] border border-[#ff0062] rounded-[2px]" />
```

---

## 🖼️ Image/Video Area

### Dimensions
- **Aspect Ratio:** 400:224 (approximately 16:9)
- **Border:** 1px solid `#777777`
- **Background:** `#acacac` placeholder

### Hitbox Visualization
- Green overlay boxes for active hitbox areas
- Positioned relative to character sprite

---

## 📋 Implementation Priority

### Phase 1: Core Card Redesign
1. [ ] Purple gradient background
2. [ ] White thick border (14px)
3. [ ] City Brawlers font integration
4. [ ] Color-coded frame data badges
5. [ ] Hit/block data with emojis

### Phase 2: Input Notation
1. [ ] Arrow icon components (all directions)
2. [ ] Attack button icons (all buttons)
3. [ ] Connector symbols
4. [ ] Multiple size variants

### Phase 3: Combo Viewer
1. [ ] Horizontal card rail
2. [ ] Swipe/tap navigation
3. [ ] Pagination component
4. [ ] Restart button

### Phase 4: Polish
1. [ ] Meter usage display
2. [ ] Hit level property icons
3. [ ] Hitbox visualization overlay
4. [ ] Character artwork backgrounds

---

## 🔗 Figma Node References

| Component | Node ID |
|-----------|---------|
| Prototypes Canvas | 1112:28495 |
| Ken 2HP Card | 1217:22251 |
| Simple Punish Combo | 1112:26705 |
| Basic Combo Test | 1112:23696 |
| DRC Buffer Combo | 1112:24871 |
| Normal Moves Category | 1217:25079 |
| Arrow/Sm Components | 1112:22432 |
| Attack Buttons/LG | 1:1260 |

---

*This document captures the design specifications from the Figma file for implementation reference.*
