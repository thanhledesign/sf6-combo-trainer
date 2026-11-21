# Parked: iCloud / Files backup (for the future native iOS build)

Removed from the web app on 2026-11-21 (V01.35). A website cannot read or write
iCloud on its own, so this only becomes useful once the app ships natively
(Capacitor iOS). Cross-device sync on web stays with Supabase email sign-in.

## What was removed
Options → "Save to Files / iCloud Drive" (`src/components/Lab/OptionsPane.jsx`, `DataButtons`),
plus an "iCloud Drive / Files / Dropbox" section in `SyncGuide.jsx`.

## The function (share sheet → Save to Files → iCloud Drive)
```js
const saveToFiles = async () => {
  const name = `session-lab-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([JSON.stringify(S, null, 2)], name, { type: 'application/json' }); // S = useRaw()
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'SF6 Session Lab backup' });
      return;
    }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  exportJson(); // plain download fallback
};
```

## When building the iOS app
- Prefer real iCloud sync: Capacitor plugin around CloudKit (or iCloud Documents container)
  behind the same storage seam as `src/lab/store.js` (localStorage is isolated there on purpose).
- Keep this share-sheet export as the manual backup path (Capacitor Share / Filesystem plugins).
- Alternative without a native app: File System Access API (desktop Chrome/Edge) auto-saving
  to a user-chosen folder, e.g. an iCloud Drive folder.
