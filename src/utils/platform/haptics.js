// Haptic feedback abstraction.
// Web: navigator.vibrate (Android/Chrome). Future Capacitor: @capacitor/haptics.
// Safari ignores vibrate, so the no-op fallback is intentional.

const PATTERNS = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 50, 50],
};

const canVibrate = () =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export const haptics = {
  async impact(style = 'light') {
    if (!canVibrate()) return;
    navigator.vibrate(PATTERNS[style] ?? PATTERNS.light);
  },

  async cancel() {
    if (!canVibrate()) return;
    navigator.vibrate(0);
  },
};
