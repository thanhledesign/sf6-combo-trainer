# SF6 Combo Trainer - Version History
## Save Points & Restore Guide

*Last Updated: December 2, 2025*

---

## 🔢 Versioning Convention

**Format:** `V01.XX` where XX increments with each update

| Version | Description |
|---------|-------------|
| V01.25 | Baseline (gray cards) |
| V01.26 | Purple card redesign |
| V01.27 | Corrected videos |
| V01.28 | Mobile prep utilities |
| V01.29 | PWA + Google Sheets CMS (current) |
| V01.30 | Next update |

**Rule:** Always create a new version zip before major changes.

---

## 📦 Version Save Points

### V01.29 (CURRENT)
**Date:** December 2, 2025
**File:** `sf6-combo-trainer-V01.29.zip`
**Status:** ✅ PWA installable + Google Sheets CMS ready

**What changed from V01.28:**
- ✅ Added `vite-plugin-pwa` for Progressive Web App support
- ✅ Updated `vite.config.js` with PWA configuration
- ✅ Generated app icons (72px to 512px, plus maskable versions)
- ✅ Added `src/utils/sheetsData.js` - Google Sheets data fetcher
- ✅ Added `src/hooks/useCharacterData.js` - Hybrid data loading hook
- ✅ Added `docs/GOOGLE-SHEETS-CMS.md` - Setup documentation
- ✅ Updated `index.html` - Removed manual manifest link (auto-generated)

**Features added:**
- 📱 **PWA Installable** - "Add to Home Screen" on mobile/desktop
- 🔄 **Offline Support** - Service worker caches all assets
- 📊 **Google Sheets CMS** - Fetch frame data from your spreadsheet
- 🔁 **Fallback System** - Uses static JSON if sheets unavailable
- ⚡ **App Shortcuts** - Quick access to Browse, Punish, Search

**PWA Details:**
- Service worker with Workbox
- Caches videos up to 20MB
- Google Sheets cached for 1 hour
- Icons: 72, 96, 128, 144, 152, 180, 192, 384, 512
- Maskable icons for Android adaptive icons

**To use Google Sheets CMS:**
1. Publish your sheet: File → Share → Publish to web
2. Get tab GIDs from URLs
3. Update `src/utils/sheetsData.js` with GIDs
4. See `docs/GOOGLE-SHEETS-CMS.md` for full guide

**To restore V01.29:**
```bash
unzip sf6-combo-trainer-V01.29.zip
cd sf6-combo-trainer && npm install && npm run dev
```

---

### V01.28
**Date:** December 2, 2025
**File:** `sf6-combo-trainer-V01.28.zip`
**Status:** ✅ Mobile preparation utilities integrated

**What changed from V01.27:**
- ✅ Added `src/utils/storage.js` - Storage abstraction layer (localStorage now, Capacitor-ready)
- ✅ Added `src/utils/haptics.js` - Haptic feedback (vibration on Android, Capacitor-ready for iOS)
- ✅ Added `src/utils/videoLoader.js` - Video optimization utilities (connection-aware, preloading)
- ✅ Added `src/hooks/useSwipeGesture.js` - Swipe gesture detection hook
- ✅ Updated `src/index.css` - Safe area CSS for iPhone notch/home bar
- ✅ Updated `index.html` - viewport-fit=cover + PWA meta tags
- ✅ Updated `MoveCard.jsx` - Haptics on flip + swipe to flip
- ✅ Updated `App.jsx` - nav-bar class for safe areas
- ✅ Added `public/manifest.json` - PWA manifest
- ✅ Added mobile prep documentation (IMPLEMENTATION-CHECKLIST.md, etc.)

**Features added:**
- 📱 Safe area support (iPhone notch, Dynamic Island, home indicator)
- 👆 Swipe left/right to flip cards
- 📳 Haptic feedback on card flip and hit type toggle
- 🔧 Storage abstraction ready for Capacitor migration
- 📺 Video optimization utilities ready for use

**To restore V01.28:**
```bash
unzip sf6-combo-trainer-V01.28.zip
cd sf6-combo-trainer && npm install && npm run dev
```

---

### V01.27
**Date:** December 1, 2025
**File:** `sf6-combo-trainer-V01.27.zip`
**Status:** ✅ Corrected video content

**What changed from V01.26:**
- ✅ Fixed mislabeled videos (shoryuken was actually dragonlash)
- ✅ Added correct shoryuken.mp4 and shoryuken_od.mp4
- ✅ Added dragonlash_l.mp4 and dragonlash_od.mp4
- ✅ All 16 Ken/Terry videos now correct:
  - shoryuken.mp4 (actual shoryuken)
  - shoryuken_od.mp4 (actual OD shoryuken)
  - dragonlash_l.mp4 (L dragonlash kick)
  - dragonlash_od.mp4 (OD dragonlash kick)
  - jinrai_l.mp4, jinrai_od.mp4
  - jinrai_l_followup.mp4, jinrai_od_followup.mp4 (for future use)
  - chin_buster.mp4
  - quick_dash.mp4, quick_dash_stop.mp4 (for future use)
  - cancel_drive_rush.mp4, parry_drive_rush.mp4
  - sa3.mp4
  - burn_knuckle_od.mp4, burn_knuckle_m_followup.mp4 (Terry)

**To restore V01.27:**
```bash
unzip sf6-combo-trainer-V01.27.zip
cd sf6-combo-trainer && npm install && npm run dev
```

---

### V01.26
**Date:** December 1, 2025
**File:** `sf6-combo-trainer-V01.26.zip`
**Status:** ✅ Purple card redesign complete

**What changed from V01.25:**
- ✅ Purple gradient card backgrounds (`#200147` → `#2e0549` → `#1a0338`)
- ✅ Purple gradient borders (subtle glow effect)
- ✅ Color-coded frame data badges:
  - Startup = Teal (`bg-teal-500`)
  - Active = Pink (`bg-pink-500`)
  - Recovery = Blue (`bg-blue-500`)
  - Total = Dark gray with border
- ✅ Frame advantage badges with emoji icons (👊 hit, 🛡️ block)
- ✅ Links section moved to back side only
- ✅ Updated text colors to purple-tinted (purple-300, purple-200)
- ✅ Updated flip button styling to match purple theme

**To restore V01.26:**
```bash
unzip sf6-combo-trainer-V01.26.zip
cd sf6-combo-trainer && npm install && npm run dev
```

---

### V01.25 (BASELINE BACKUP)
**Date:** December 1, 2025
**File:** `sf6-combo-trainer-V01.25.zip`
**Status:** ✅ Original gray design - restore point before card redesign

**To restore V01.25:**
```bash
unzip sf6-combo-trainer-V01.25.zip
cd sf6-combo-trainer && npm install && npm run dev
```

**Features included:**
- 7 characters with 538 moves
- Flippable move cards (your/opponent perspective)
- Hit type toggle (Normal/Counter/Punish Counter)
- Cross-character search
- Punish Calculator
- Mobile hamburger menu
- Sticky navigation
- 2-column compact view
- Video demonstrations for Ken & Terry moves

**Design:**
- Dark theme (gray-900 background)
- Gray-800 cards with thin borders
- Purple-600 accent color
- Simple, clean layout
- Functional but not fancy

**To restore:**
```bash
# 1. Backup current work (if needed)
zip -r sf6-backup-$(date +%Y%m%d).zip sf6-combo-trainer -x "*/node_modules/*"

# 2. Delete current folder
rm -rf sf6-combo-trainer

# 3. Unzip v1.0-stable
unzip sf6-combo-trainer-v1.0-stable.zip

# 4. Reinstall dependencies
cd sf6-combo-trainer && npm install
```

---

## 🔄 Version Comparison

| Feature | v1.0-stable | v2.0 (planned) |
|---------|-------------|----------------|
| Card design | Gray-800, thin border | Purple gradient, 14px white border |
| Frame data | Plain text | Color-coded badges |
| Input notation | Text arrows (↓+HP) | Visual icons (arrow + button graphics) |
| Fonts | System Inter | City Brawlers + Inter |
| Combo viewer | ❌ Not built | Horizontal scrolling cards |
| Move detail page | ❌ Not built | Full-screen template |

---

## 📋 Design Elements Inventory

### Current (v1.0) Elements - User KEEPING ✅
*(Captured December 1, 2025)*

**Navigation:**
- [x] Hamburger menu (mobile)
- [x] "SF6 Combo Trainer" logo/text
- [x] Floating search icon
- [x] Character avatar in nav

**Character Selection:**
- [x] Modal popup style
- [x] 2x4 grid layout
- [x] Character thumbnails
- [x] Character names below

**Browse Page:**
- [x] Category tabs (Neutral/Offensive/Combo/Corner)
- [x] Sticky category nav
- [x] Card grid (1-4 columns responsive)
- [x] Compact/Full toggle

**Card Elements (keeping):**
- [x] Video/image at top
- [x] Move name + input line
- [x] Hit type toggle (N/CH/PC)
- [x] Properties tags
- [x] Flip to opponent view

**Colors:**
- [x] Dark background (gray-900)
- [x] Purple accent
- [x] Green = safe
- [x] Red = unsafe

---

### Elements Being CHANGED 🔄
*(From Figma design system)*

**Card Styling:**
- [ ] Background: gray-800 → **Purple gradient** (`#200147` → `#2e0549`)
- [ ] Border: thin gray → **Gradient based on card component**
- [ ] Frame data: plain text → **Color-coded badges**
- [ ] Links section: on front → **Move to back side only**

---

### NEW Features to Build 🆕
*(User will create wireframes in Figma first)*

- [ ] **Move Detail Page** - Full-screen template with extended info
- [ ] **Wireframes & Flows** - User to create in Figma, Claude implements via MCP
- [ ] **Combo Viewer** - Horizontal scrolling (after wireframe)
- [ ] **Study Mode** - Flash cards (after wireframe)

---

## 📝 Notes

- Always create a new version zip before major changes
- Name format: `sf6-combo-trainer-vX.X-description.zip`
- Keep at least 2 previous versions as backups
- Document what changed between versions

---

*This document tracks save points for easy rollback*
