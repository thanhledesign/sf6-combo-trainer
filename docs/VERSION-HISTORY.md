# SF6 Combo Trainer - Version History
## Save Points & Restore Guide

*Last Updated: December 1, 2025*

---

## 🔢 Versioning Convention

**Format:** `V01.XX` where XX increments with each update

| Version | Description |
|---------|-------------|
| V01.25 | Baseline (gray cards) |
| V01.26 | Purple card redesign (current) |
| V01.27 | Next update |
| V01.28 | And so on... |

**Rule:** Always create a new version zip before major changes.

---

## 📦 Version Save Points

### V01.26 (CURRENT)
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
