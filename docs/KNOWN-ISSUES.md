# SF6 Combo Trainer - Known Issues & Limitations
## Bug Tracker & Technical Debt

**Last Updated:** December 1, 2025
**Open Issues:** 5
**Resolved Issues:** 4

---

## 🔴 Open Issues

### Issue #001 - Cards in same row have different heights
**Severity:** Low (Cosmetic)
**Status:** Accepted - Won't Fix
**Component:** `MoveCard.jsx`

**Description:**
When cards are displayed in a grid, cards in the same row may have different heights based on content length. Each card matches its own front/back height, but not row siblings.

**Impact:**
Visual inconsistency in grid layout. Does not affect functionality.

**Workaround:**
Accepted as current behavior. Would require complex CSS grid solutions or JavaScript height synchronization.

**Decision:**
Accepted for MVP. May revisit in future polish phase.

---

### Issue #002 - Large bundle size warning
**Severity:** Low (Performance)
**Status:** Open
**Component:** Build output

**Description:**
Build produces a warning: "Some chunks are larger than 500 kB after minification."
- `index.js`: ~615 KB (gzipped: ~121 KB)
- Character thumbnails: 238-802 KB each

**Impact:**
Slower initial load times, especially on mobile.

**Potential Fix:**
1. Implement route-based code splitting with `React.lazy()`
2. Optimize/compress character thumbnails
3. Use `manualChunks` in Vite config

**Priority:**
Low - acceptable for MVP, optimize before launch

---

### Issue #003 - No offline support
**Severity:** Medium (Feature Gap)
**Status:** Open
**Component:** Architecture

**Description:**
App requires internet connection. No PWA/service worker implemented.

**Impact:**
Users can't access frame data without internet (common use case: at tournaments, in training mode).

**Potential Fix:**
Implement PWA with service worker for offline caching.

**Priority:**
Medium - important for target use case

---

### Issue #004 - Videos don't preload on mobile
**Severity:** Low (UX)
**Status:** Open
**Component:** `MoveCard.jsx`

**Description:**
On mobile, videos show play button overlay but don't preload thumbnail frame. Users see black box until tapped.

**Impact:**
Minor UX issue - users don't see move preview until interaction.

**Potential Fix:**
Add `poster` attribute to video elements with static thumbnail.

**Priority:**
Low

---

### Issue #005 - Search doesn't persist on navigation
**Severity:** Low (UX)
**Status:** Open
**Component:** `App.jsx`

**Description:**
When user searches, navigates away, then returns to search page, the previous query is lost.

**Impact:**
Minor inconvenience.

**Potential Fix:**
Store search query in URL params or localStorage.

**Priority:**
Low

---

## ✅ Resolved Issues

### Issue #R001 - CharacterSelectorModal missing
**Severity:** Critical
**Status:** ✅ Resolved (Session 4)
**Resolution:** Created component at `src/components/Navigation/CharacterSelectorModal.jsx`

---

### Issue #R002 - Thumbnail imports failing (.png vs .svg)
**Severity:** Critical
**Status:** ✅ Resolved (Session 4)
**Resolution:** Updated all imports to use .png extension, added actual PNG files

---

### Issue #R003 - Sticky nav z-index conflicts
**Severity:** Medium
**Status:** ✅ Resolved (Session 3)
**Resolution:** Established z-index hierarchy:
- Main nav: `z-50`
- Search dropdown: `z-[60]`
- Page subnav: `z-40`
- Modals: `z-50`

---

### Issue #R004 - Video tap not working on mobile
**Severity:** Medium
**Status:** ✅ Resolved (Session 3)
**Resolution:** Added `handleMediaClick` with immediate play on first tap

---

## 📋 Technical Debt

### TD-001: No TypeScript
**Impact:** No type safety, harder to catch errors
**Effort:** High (would need to convert all files)
**Priority:** Low for MVP

### TD-002: No component tests
**Impact:** Can't verify components work after changes
**Effort:** Medium
**Priority:** Medium - add before major refactors

### TD-003: Repeated thumbnail import boilerplate
**Impact:** Same 7 imports in multiple files
**Effort:** Low
**Priority:** Low - could create shared `thumbnails.js` utility

### TD-004: No error boundaries
**Impact:** If component crashes, whole app crashes
**Effort:** Low
**Priority:** Medium

### TD-005: Character data not validated
**Impact:** Malformed JSON could crash app
**Effort:** Low
**Priority:** Low

---

## 🚫 Known Limitations (By Design)

These are intentional constraints, not bugs:

1. **No backend** - All client-side, localStorage only
2. **No user accounts** - Can't sync across devices
3. **Static data** - Manual updates required for game patches
4. **English only** - No internationalization
5. **7 characters only** - Full roster not implemented yet

---

## Reporting New Issues

When encountering a bug, document:

```markdown
### Issue #XXX - [Brief Title]
**Severity:** Critical / High / Medium / Low
**Status:** Open
**Component:** [File or feature affected]

**Description:**
[What happens]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots/Errors:**
[If applicable]

**Potential Fix:**
[Ideas for resolution]

**Priority:**
[Urgency level]
```

---

*This document should be updated when issues are discovered or resolved.*
