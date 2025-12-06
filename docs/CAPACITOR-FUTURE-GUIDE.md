# SF6 Combo Trainer - Capacitor Native App Guide
## When You're Ready for App Store & Play Store

---

## Overview

This guide covers how to turn your React web app into native iOS and Android apps using Capacitor. The preparation work (storage abstraction, haptics, safe areas) makes this process smooth.

**Time Estimate:** 4-6 hours for first build

---

## Prerequisites

Before starting:
- [ ] PWA working correctly
- [ ] App icons created (192px and 512px minimum)
- [ ] Utility abstractions in place (storage.js, haptics.js)
- [ ] Safe area CSS applied
- [ ] For iOS: Mac with Xcode installed
- [ ] For Android: Android Studio installed

---

## Step-by-Step Guide

### 1. Install Capacitor Core

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor in your project
npx cap init
```

When prompted:
- **App name:** SF6 Combo Trainer
- **App ID:** com.yourname.sf6trainer (use your domain reversed)

This creates `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.sf6trainer',
  appName: 'SF6 Combo Trainer',
  webDir: 'dist',  // Vite's output directory
  server: {
    androidScheme: 'https'
  },
  // iOS-specific
  ios: {
    contentInset: 'always',  // Respect safe areas
  },
  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#111827',
      showSpinner: false,
    },
  },
};

export default config;
```

### 2. Add Native Platforms

```bash
# Add iOS platform
npm install @capacitor/ios
npx cap add ios

# Add Android platform
npm install @capacitor/android
npx cap add android
```

This creates `ios/` and `android/` folders with native projects.

### 3. Install Useful Plugins

```bash
# Storage (replaces localStorage)
npm install @capacitor/preferences

# Haptic feedback
npm install @capacitor/haptics

# Status bar control
npm install @capacitor/status-bar

# Splash screen
npm install @capacitor/splash-screen

# Share functionality
npm install @capacitor/share

# Keyboard control (for search UX)
npm install @capacitor/keyboard
```

### 4. Update Utility Files

**storage.js - Enable Capacitor storage:**
```javascript
// Uncomment this import:
import { Preferences } from '@capacitor/preferences';

// Comment out localStorage implementation
// Uncomment Capacitor implementation
```

**haptics.js - Enable native haptics:**
```javascript
// Uncomment this import:
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Comment out web implementation
// Uncomment Capacitor implementation
```

### 5. Build and Sync

```bash
# Build your React app
npm run build

# Copy web assets to native projects
npx cap sync
```

**Run `npx cap sync` after every build!**

### 6. Configure iOS (Xcode)

```bash
# Open iOS project in Xcode
npx cap open ios
```

In Xcode:
1. **Select your team** in Signing & Capabilities
2. **Set bundle identifier** (should match capacitor.config.ts)
3. **Add app icons** in Assets.xcassets
4. **Configure splash screen** in LaunchScreen.storyboard

**Info.plist additions:**
```xml
<!-- Allow videos to play inline -->
<key>UIWebViewAllowsInlineMediaPlayback</key>
<true/>

<!-- App description for privacy -->
<key>NSHumanReadableCopyright</key>
<string>SF6 Combo Trainer - Learn fighting game counterplay</string>
```

### 7. Configure Android (Android Studio)

```bash
# Open Android project
npx cap open android
```

In Android Studio:
1. **Set package name** in build.gradle
2. **Add app icons** in res/mipmap folders
3. **Configure splash screen** in styles.xml

**AndroidManifest.xml already configured by Capacitor**

### 8. Test on Device/Simulator

**iOS:**
```bash
# Run on iOS simulator
npx cap run ios

# Or build in Xcode and run on device
```

**Android:**
```bash
# Run on Android emulator
npx cap run android

# Or build APK
cd android && ./gradlew assembleDebug
```

---

## Native-Specific Enhancements

### Status Bar Styling

```javascript
// In App.jsx or a startup file
import { StatusBar, Style } from '@capacitor/status-bar';

// Match your dark theme
StatusBar.setStyle({ style: Style.Dark });
StatusBar.setBackgroundColor({ color: '#1f2937' });
```

### Hide Splash Screen After Load

```javascript
import { SplashScreen } from '@capacitor/splash-screen';

// In your App.jsx useEffect
useEffect(() => {
  // Hide splash screen when app is ready
  SplashScreen.hide();
}, []);
```

### Native Share

```javascript
import { Share } from '@capacitor/share';

const shareCombo = async (comboData) => {
  await Share.share({
    title: 'SF6 Combo',
    text: `Check out this ${comboData.character} combo!`,
    url: 'https://yourapp.com/combo/123',
  });
};
```

### Keyboard Handling (for Search)

```javascript
import { Keyboard } from '@capacitor/keyboard';

// Hide keyboard when scrolling
Keyboard.addListener('keyboardWillShow', () => {
  // Maybe scroll to search input
});

Keyboard.addListener('keyboardWillHide', () => {
  // Reset scroll position
});
```

---

## App Store Submission Checklist

### iOS App Store

**Required Assets:**
- [ ] App icon (1024x1024)
- [ ] Screenshots (6.5", 5.5" iPhone at minimum)
- [ ] App description (4000 chars max)
- [ ] Keywords (100 chars max)
- [ ] Support URL
- [ ] Privacy policy URL

**Build Settings:**
- [ ] Version number set
- [ ] Build number incremented
- [ ] Provisioning profile configured
- [ ] Archive and upload via Xcode

### Google Play Store

**Required Assets:**
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone and tablet)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Privacy policy URL

**Build Settings:**
- [ ] Version code incremented
- [ ] Signed APK or AAB
- [ ] Upload via Play Console

---

## Common Issues & Solutions

### Issue: White flash on app start
**Solution:** Configure splash screen with matching background color

### Issue: Videos don't play
**Solution:** Ensure `playsInline` and `muted` attributes on video elements

### Issue: Storage not persisting
**Solution:** Make sure you're using Capacitor Preferences, not localStorage

### Issue: Haptics not working on iOS
**Solution:** Check Capacitor Haptics is installed and imported correctly

### Issue: App rejected for missing privacy policy
**Solution:** Create simple privacy policy page, host it, link in store listing

### Issue: Build fails with signing error
**Solution:** Ensure your Apple Developer / Google Play account is set up correctly

---

## Development Workflow

After initial setup, your workflow is:

```bash
# 1. Make changes to React code
# 2. Build
npm run build

# 3. Sync to native projects
npx cap sync

# 4. Test
npx cap run ios
# or
npx cap run android

# 5. When ready for release, open native IDE
npx cap open ios
npx cap open android
```

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Apple Developer Account | $99/year |
| Google Play Developer | $25 one-time |
| Capacitor | Free |
| React/Vite | Free |
| **Total to publish** | **~$125** |

---

## Timeline Estimate

| Task | Time |
|------|------|
| Install & configure Capacitor | 1 hour |
| Configure iOS project | 1-2 hours |
| Configure Android project | 1-2 hours |
| Create store assets | 2-3 hours |
| Testing & bug fixes | 2-4 hours |
| Store submission | 1-2 hours |
| **Total** | **8-14 hours** |

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/console/about/policies/)

---

*This guide assumes the mobile preparation work has been completed. Start with IMPLEMENTATION-CHECKLIST.md first.*
