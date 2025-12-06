# SF6 Combo Trainer - Mobile App Preparation Guide
## Planning for iOS & Android Native Apps

**Created:** December 1, 2025
**Purpose:** Foundation work to make future native app development seamless

---

## 📱 STRATEGY DECISION: Capacitor

After analysis, **Capacitor** is the recommended approach for this project:

### Why Capacitor?
1. **Keep 95%+ of existing React + Tailwind code**
2. **One codebase** for web + iOS + Android
3. **Content-focused app** (cards, frame data, videos) - perfect fit
4. **Incremental native features** - add as needed
5. **App Store & Play Store deployment**

### Why NOT React Native?
- Would require rewriting ALL UI components
- Can't use Tailwind directly
- More development time for same result
- Better for complex animations (not needed here)

---

## 📦 WHAT'S IN THIS PACKAGE

### Utility Files (Add to `src/utils/`)
| File | Purpose |
|------|---------|
| `storage.js` | Abstracted storage layer (localStorage → native later) |
| `haptics.js` | Haptic feedback with web fallback |
| `videoLoader.js` | Video quality optimization for mobile data |

### Hooks (Add to `src/hooks/`)
| File | Purpose |
|------|---------|
| `useSwipeGesture.js` | Swipe gestures for card flip |

### Configuration
| File | Purpose |
|------|---------|
| `vite.config.pwa.js` | PWA plugin configuration for Vite |
| `manifest.json` | PWA manifest (add to `public/`) |
| `safe-areas.css` | CSS for iPhone notch/Android cutouts |

### Documentation
| File | Purpose |
|------|---------|
| `IMPLEMENTATION-CHECKLIST.md` | Step-by-step implementation guide |
| `CAPACITOR-FUTURE-GUIDE.md` | Guide for when ready to add Capacitor |

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: Do Now (Before Next Features)
1. ✅ Add `storage.js` utility
2. ✅ Add `haptics.js` utility  
3. ✅ Add safe area CSS
4. ✅ Add swipe gesture hook

### Phase 2: Before Public Launch
1. ⬜ Add PWA support (manifest + service worker)
2. ⬜ Test offline functionality
3. ⬜ Create app icons (192px, 512px)

### Phase 3: When Ready for App Stores
1. ⬜ Install Capacitor
2. ⬜ Generate iOS/Android projects
3. ⬜ Test on real devices
4. ⬜ Submit to stores

---

## 💡 KEY ARCHITECTURAL DECISIONS

### 1. Storage Abstraction
**Today:** Uses localStorage
**Future:** Swap to Capacitor Preferences with ONE LINE change

```javascript
// Current implementation uses localStorage
// When Capacitor is added, change the import:
// import { Preferences } from '@capacitor/preferences';
// And update the methods to use Preferences API
```

### 2. Haptic Feedback
**Today:** Uses Vibration API (works on Android Chrome)
**Future:** Swap to Capacitor Haptics for native feel

### 3. Video Loading
**Today:** Direct paths
**Future:** Quality selection based on connection speed

### 4. Touch Gestures
**Today:** Tap to flip cards
**Future:** Swipe left/right to flip (more natural on mobile)

---

## 📐 SAFE AREAS EXPLAINED

Modern phones have notches, dynamic islands, and rounded corners. The safe area CSS handles:

- **iPhone notch/Dynamic Island** - Content won't hide behind it
- **Android punch-holes** - Camera cutouts
- **Bottom home indicators** - iOS home bar, Android gesture areas
- **Rounded corners** - Content stays visible

```
┌─────────────────────────┐
│░░░░░░░ NOTCH ░░░░░░░░░│ ← safe-area-inset-top
├─────────────────────────┤
│                         │
│    YOUR CONTENT         │
│                         │
├─────────────────────────┤
│░░░░░ HOME BAR ░░░░░░░░│ ← safe-area-inset-bottom
└─────────────────────────┘
```

---

## 🔌 FUTURE CAPACITOR PLUGINS

When you add Capacitor, these plugins will enhance the app:

| Feature | Plugin | Use Case |
|---------|--------|----------|
| Offline Storage | `@capacitor/preferences` | Save favorites, study progress |
| Haptic Feedback | `@capacitor/haptics` | Card flip, button presses |
| Share | `@capacitor/share` | Share combos with friends |
| Status Bar | `@capacitor/status-bar` | Match dark theme |
| Splash Screen | `@capacitor/splash-screen` | Branded launch screen |
| Keyboard | `@capacitor/keyboard` | Better search UX |

---

## ⏱️ TIME ESTIMATES

| Task | Time |
|------|------|
| Add utility files | 15 min |
| Add safe area CSS | 5 min |
| Integrate swipe gesture | 30 min |
| Add PWA support | 1-2 hours |
| Test PWA on devices | 1 hour |
| **Total Foundation Work** | **~3-4 hours** |

| Future Task | Time |
|-------------|------|
| Add Capacitor | 30 min |
| Generate iOS project | 15 min |
| Generate Android project | 15 min |
| Test on simulators | 1 hour |
| Build for stores | 2-3 hours |
| **Total Native Build** | **~5-6 hours** |

---

## 🚀 QUICK START

1. Copy utility files to `src/utils/`
2. Copy hook files to `src/hooks/`
3. Add safe area CSS to `index.css`
4. Update components to use new utilities
5. See `IMPLEMENTATION-CHECKLIST.md` for detailed steps

---

*This preparation ensures your React web app will transition to native iOS/Android with minimal friction.*
