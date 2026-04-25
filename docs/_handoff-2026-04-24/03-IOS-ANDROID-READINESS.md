# 03 — iOS / ANDROID READINESS

Architecture patterns to keep the codebase ready for an eventual native app via Capacitor — without installing Capacitor today.

---

## Why This Matters

Thanh wants to ship a native iOS/Android app eventually. The current PWA is the bridge — it runs on mobile via the browser, and the same code can later be wrapped in Capacitor to ship to the App Store and Play Store.

Capacitor is simpler than React Native: it's a web view wrapper around your existing web app, plus a plugin system for native APIs. The code you ship as a PWA today can ship as a native app tomorrow with **zero rewrites** — *if* the codebase doesn't depend on browser-only patterns that break inside a web view.

The patterns below are the ones that bite you on Capacitor. Follow them now; pay nothing later.

---

## The Core Pattern: Platform Abstractions

Anywhere the code currently calls a browser API directly, route it through a thin abstraction module instead. The web implementation stays the same; later, a one-line swap inside the abstraction switches to Capacitor's native equivalent.

```
src/utils/platform/
├── storage.js     ← wraps localStorage / sessionStorage  (✓ exists, T4)
├── haptics.js     ← wraps navigator.vibrate              (✓ exists, T4)
└── index.js       ← single import point                  (✓ exists, T4)
```

`network.js` was intentionally **not** created — see §8 below. Add it when (and if) Capacitor integration surfaces a real CORS or cookie issue.

### Pattern Example — Storage

```js
// src/utils/platform/storage.js

// TODAY: web implementation using localStorage
export const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  async set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key) {
    localStorage.removeItem(key);
  },
  async clear() {
    localStorage.clear();
  },
};

// LATER (when Capacitor lands):
// import { Preferences } from '@capacitor/preferences';
// export const storage = { ... uses Preferences API ... };
```

Note the `async` everywhere — even though `localStorage` is synchronous on web, the Capacitor Preferences API is async. Writing async-first today means no refactor later.

### Pattern Example — Haptics

```js
// src/utils/platform/haptics.js

const HAPTICS = {
  light:  10,
  medium: 25,
  heavy:  50,
  success: [10, 50, 10],
  error: [50, 50, 50],
};

export const haptics = {
  async impact(style = 'light') {
    const pattern = HAPTICS[style] ?? HAPTICS.light;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  },
};
```

The `typeof navigator !== 'undefined'` guard prevents SSR / build-time errors. The `navigator.vibrate &&` guard handles browsers that don't support it (Safari, mostly).

---

## Patterns to Follow Now

### 1. All persistent state goes through `storage.js`

Anything that survives a page refresh — user preferences, last-selected character, password gate session, search history — uses the storage abstraction. Never call `localStorage` or `sessionStorage` directly outside `src/utils/platform/storage.js`.

**Refactor signal**: `grep -r "localStorage\|sessionStorage" src/` should return only the abstraction file itself.

### 2. All vibration goes through `haptics.js`

Touch interactions on the MoveCard (flip, swipe), button presses on the punish calculator, mobile menu toggles — all through `haptics.impact()`. Never call `navigator.vibrate()` directly.

### 3. Use `env(safe-area-inset-*)` for mobile padding

Don't hardcode top/bottom padding for nav bars. Use:

```css
.app-nav {
  padding-top: env(safe-area-inset-top);
}
.app-footer {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Works on PWA today (with the `viewport-fit=cover` meta tag), works on Capacitor tomorrow with no change. iPhone notches and home indicators handle themselves.

### 4. Avoid `window.location` for navigation

Use react-router's `useNavigate()` instead. `window.location.href = '...'` causes full page reloads that work on web but feel broken in a native web view. Internal navigation should always go through the router.

External links (e.g., to streetfighter.com or YouTube tutorials) are fine with `window.open()` for now, but mark them — when Capacitor lands, external links should route through `@capacitor/browser` for proper in-app browser presentation.

### 5. Avoid direct DOM manipulation

`document.getElementById()`, `document.querySelector()`, etc. — should be rare. Use refs (`useRef`) instead. DOM manipulation works in a web view, but it's brittle and harder to test.

### 6. Make sure all asset URLs are relative

If you load images, videos, or static assets, use relative paths (`/images/ken.png`) or imports (`import kenImage from './ken.png'`). Avoid absolute URLs to your own domain — when wrapped in Capacitor, the app runs from `capacitor://` (iOS) or `https://localhost` (Android), and absolute URLs to `https://sf6-combo-trainer.vercel.app` will break.

External assets (Google Sheet, YouTube embeds) are fine — those are HTTPS URLs to other origins, which work everywhere.

### 7. Use `import.meta.env.VITE_*` for config

Anything that varies by environment (API URLs, password gate password, Sheet ID if you ever extract it) goes in `.env*` files and reads via `import.meta.env.VITE_*`. Don't hardcode environment-specific values in source.

### 8. Network requests: keep them browser-API for now

The `fetch()` API works fine on web and inside Capacitor's web view. **Don't** wrap it pre-emptively — wait until Capacitor is actually integrated and you hit a CORS or cookie issue, then reach for `@capacitor/http`. Premature abstraction here adds complexity for no current benefit.

---

## Patterns to Avoid

These will break or behave strangely on native. Catch them in code review.

### `localStorage` synchronous expectations

```js
// ❌ BAD — relies on synchronous return
function getCharacter() {
  return localStorage.getItem('character') || 'ken';
}

// ✅ GOOD — async, abstraction-friendly
async function getCharacter() {
  return (await storage.get('character')) || 'ken';
}
```

### Cookies for auth

If the password gate or any future auth uses `document.cookie`, that breaks on iOS Capacitor by default (cross-origin cookie policies). Use `storage.set()` for auth tokens, not cookies.

### `<a href="...">` for SPA routes

```jsx
// ❌ BAD — full page reload
<a href="/browse/ken">Ken</a>

// ✅ GOOD — client-side route
<Link to="/browse/ken">Ken</Link>
```

### Service Worker direct access in app code

The PWA's service worker handles caching. Don't reach into `navigator.serviceWorker` from app code. If you need to check whether the app is installed or running standalone, use `window.matchMedia('(display-mode: standalone)')` and abstract it if the check appears in more than one place.

### Window globals (`window.foo = ...`)

Don't stuff things on the global window object. They survive across navigations on web but get cleared inconsistently on Capacitor. Use React context, hooks, or storage instead.

---

## When to Actually Adopt Capacitor

Don't install Capacitor today. The tooling adds complexity (build pipelines, native dependencies, Xcode for iOS builds) and you'd be paying that cost without shipping a native app. Wait until:

1. The PWA is feature-complete enough that there's clear value in App Store presence
2. Push notifications, in-app purchases, or other native-only features become a roadmap priority
3. The user (Thanh) explicitly asks to start the native build pipeline

When that day comes, the migration is roughly:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```

Then update the four abstraction files (`storage.js`, `haptics.js`, `network.js`, plus a new `browser.js` for external links) to use Capacitor plugins instead of web APIs. App code doesn't change. Xcode and Android Studio handle the rest.

---

## Audit Checklist (Use During Task 4)

Run this against `src/`:

```bash
# Should return only src/utils/platform/storage.js
grep -rn "localStorage\|sessionStorage" src/

# Should return only src/utils/platform/haptics.js
grep -rn "navigator.vibrate" src/

# Should return only intentional external link uses
grep -rn "window.location" src/

# Should return only the password gate's env var (post-T5)
grep -rn "import.meta.env" src/

# DOM manipulation — review each result
grep -rn "document\.\(getElementById\|querySelector\|createElement\)" src/

# Cookies — should be empty
grep -rn "document\.cookie" src/

# Hardcoded production URLs in source — should be empty or only in config
grep -rn "https://sf6-combo-trainer.vercel.app" src/
```

For each match outside the expected location: refactor or document why it's an exception in this file under "Known Compromises" below.

---

## Known Compromises

Populated during T4 audit (2026-04-24). Format: filename:line — what it is — why we kept it.

- `src/main.jsx:7` — `document.getElementById('root')` — React's standard root mount. Not "DOM manipulation in app code"; this is the framework entry point. Capacitor web view supports it identically to a browser.
- `src/App.jsx:113` — `window.scrollTo(0, 0)` on route change — works identically in Capacitor web view. Not abstraction-worthy.
- `src/components/CharacterCards.jsx:253`, `src/components/Browse/MoveBrowser.jsx:35` — `window.innerWidth < 768` for grid column count — Capacitor web view exposes `window.innerWidth` correctly. If we ever add tablet-vs-phone differentiation by device class (not just width), revisit.
- `src/components/Search/SearchResults.jsx:48,160`, `src/components/Browse/MoveBrowser.jsx:44,54` — `window.addEventListener('scroll', ...)` and `window.scrollTo({behavior: 'smooth'})` — both work in Capacitor web view.
- `src/components/auth/PasswordGate.jsx` — direct `sessionStorage` use (T5). The gate needs a synchronous read on first render to avoid a flash of unlocked content, so the async `platform/storage` wrapper would be a regression here. Behavior is also intentionally tab-scoped (clears on close) — different lifecycle from app state. Matches the pattern from money-app-2026. If a second consumer ever needs sessionStorage, extract a sync `sessionStorage` variant in `platform/`.

**T4 audit summary (2026-04-24):** Codebase was already exceptionally clean. No `localStorage`, `sessionStorage`, `navigator.vibrate`, `document.cookie`, `window.location`, hardcoded prod URLs, or `<a href>` for SPA routes. The platform abstraction modules now exist as a forward-compatible layer ready for the V01.31 win/loss tracker (the first persistent-state feature) and any future state-bearing work.

---

## Useful Reading (Before Capacitor Migration)

When the day comes, these are the docs that'll save you time:

- Capacitor docs: https://capacitorjs.com/docs
- Capacitor Preferences API (storage replacement): https://capacitorjs.com/docs/apis/preferences
- Capacitor Haptics API: https://capacitorjs.com/docs/apis/haptics
- Capacitor Browser API (in-app browser): https://capacitorjs.com/docs/apis/browser
- iOS-specific: https://capacitorjs.com/docs/ios
- Android-specific: https://capacitorjs.com/docs/android
