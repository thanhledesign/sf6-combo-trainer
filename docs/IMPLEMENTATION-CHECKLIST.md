# SF6 Mobile Preparation - Implementation Checklist

## Phase 1: Foundation (Do Now - ~1 hour)

### Step 1: Add Utility Files
- [ ] Copy `src/utils/storage.js` to your project's `src/utils/` folder
- [ ] Copy `src/utils/haptics.js` to your project's `src/utils/` folder  
- [ ] Copy `src/utils/videoLoader.js` to your project's `src/utils/` folder
- [ ] Copy `src/hooks/useSwipeGesture.js` to your project's `src/hooks/` folder

### Step 2: Add Safe Area CSS
- [ ] Open your `src/index.css`
- [ ] Copy contents of `css/safe-areas.css` and paste at the end
- [ ] Verify your `index.html` has the correct viewport meta tag:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  ```

### Step 3: Update Navigation Component
- [ ] Add `.nav-bar` class to your main navigation
- [ ] This automatically handles iPhone notch spacing

### Step 4: Integrate Haptics (Optional but Recommended)
In `MoveCard.jsx`, add haptic feedback to card flip:
```jsx
import haptics from '@/utils/haptics';

const handleFlip = () => {
  haptics.light();  // Add this line
  setIsFlipped(!isFlipped);
};
```

---

## Phase 2: PWA Support (Before Launch - ~2 hours)

### Step 1: Install PWA Plugin
```bash
npm install vite-plugin-pwa -D
```

### Step 2: Update Vite Config
- [ ] Open `vite.config.js`
- [ ] Import VitePWA: `import { VitePWA } from 'vite-plugin-pwa';`
- [ ] Add VitePWA to plugins array (copy config from `config/vite.config.pwa.js`)

### Step 3: Create App Icons
Create these files in `public/icons/`:
- [ ] `icon-192.png` (192x192 pixels)
- [ ] `icon-512.png` (512x512 pixels)
- [ ] `icon-maskable-512.png` (512x512 with safe zone padding)
- [ ] `apple-touch-icon.png` (180x180 pixels)

**Tip:** Use your character select screen or a fighting game controller icon

### Step 4: Add Manifest Link to index.html
- [ ] Copy `public/manifest.json` to your `public/` folder
- [ ] Add to `index.html` `<head>`:
  ```html
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  ```

### Step 5: Test PWA
- [ ] Run `npm run build && npm run preview`
- [ ] Open in Chrome, check DevTools > Application > Manifest
- [ ] Test "Install" prompt appears
- [ ] Test offline mode (disconnect network, refresh)

---

## Phase 3: Enhanced Mobile UX (Optional - ~1-2 hours)

### Swipe to Flip Cards
In `MoveCard.jsx`:
```jsx
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

// Inside component:
const swipeHandlers = useSwipeGesture({
  onSwipeLeft: () => setIsFlipped(true),
  onSwipeRight: () => setIsFlipped(false),
});

// Add to card container:
<div {...swipeHandlers} onClick={handleFlip}>
```

### Video Optimization
In `MoveCard.jsx`:
```jsx
import { getVideoUrl, getVideoConfig, getMediaToShow } from '@/utils/videoLoader';

// Replace video src:
<video 
  {...getVideoConfig()}
  src={getVideoUrl(move.video)}
/>
```

---

## Phase 4: Capacitor Native Apps (When Ready)

### Step 1: Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "SF6 Combo Trainer" "com.yourname.sf6trainer"
```

### Step 2: Add Platforms
```bash
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android
```

### Step 3: Build & Sync
```bash
npm run build
npx cap sync
```

### Step 4: Open in Native IDE
```bash
npx cap open ios      # Opens Xcode
npx cap open android  # Opens Android Studio
```

### Step 5: Update Storage (One-Line Change)
In `src/utils/storage.js`:
- [ ] Uncomment `import { Preferences } from '@capacitor/preferences';`
- [ ] Comment out localStorage implementation
- [ ] Uncomment Capacitor Preferences implementation

### Step 6: Update Haptics (One-Line Change)
In `src/utils/haptics.js`:
- [ ] Uncomment `import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';`
- [ ] Comment out web implementation
- [ ] Uncomment Capacitor implementation

---

## Testing Checklist

### Mobile Browser Testing
- [ ] iPhone Safari - Card flip works
- [ ] iPhone Safari - Videos play inline (not fullscreen)
- [ ] iPhone Safari - Content not hidden by notch
- [ ] Android Chrome - Haptics work on button press
- [ ] Android Chrome - Install prompt appears

### PWA Testing
- [ ] App installs to home screen
- [ ] App launches in standalone mode (no browser UI)
- [ ] App works offline after first load
- [ ] Videos play offline (after caching)

### Native App Testing (When Added)
- [ ] iOS Simulator - App launches
- [ ] iOS Simulator - Haptics work
- [ ] iOS Simulator - Storage persists
- [ ] Android Emulator - App launches
- [ ] Android Emulator - All features work

---

## Quick Reference: File Locations

| File | Goes In | Purpose |
|------|---------|---------|
| `storage.js` | `src/utils/` | Abstract storage |
| `haptics.js` | `src/utils/` | Haptic feedback |
| `videoLoader.js` | `src/utils/` | Video optimization |
| `useSwipeGesture.js` | `src/hooks/` | Swipe gestures |
| `safe-areas.css` | Append to `src/index.css` | Notch handling |
| `manifest.json` | `public/` | PWA manifest |
| `vite.config.pwa.js` | Merge with `vite.config.js` | PWA build config |

---

## Troubleshooting

### PWA Not Installing
- Check manifest.json is valid (no JSON errors)
- Ensure HTTPS (or localhost for testing)
- Check icon paths are correct
- Clear browser cache and retry

### Videos Not Playing on iOS
- Ensure `playsInline` attribute on video element
- Add `muted` attribute for autoplay
- Use `getVideoConfig()` helper

### Safe Areas Not Working
- Verify `viewport-fit=cover` in meta tag
- Check CSS is actually loaded
- Test on real device (simulators may not show notch)

### Haptics Not Working
- Only works on Android Chrome (web version)
- iOS Safari doesn't support Vibration API
- Will work properly when Capacitor is added

---

*Complete this checklist to prepare your app for native iOS/Android deployment.*
