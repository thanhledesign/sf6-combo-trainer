/**
 * SF6 Combo Trainer - Haptic Feedback Abstraction
 * 
 * Purpose: Provide haptic feedback for touch interactions.
 * Web fallback uses Vibration API (Android Chrome).
 * 
 * Usage:
 *   import haptics from '@/utils/haptics';
 *   
 *   // Light tap feedback (card flip, toggle)
 *   haptics.light();
 *   
 *   // Medium impact (button press)
 *   haptics.medium();
 *   
 *   // Heavy impact (important action)
 *   haptics.heavy();
 *   
 *   // Success pattern (quiz correct)
 *   haptics.success();
 *   
 *   // Error pattern (quiz wrong)
 *   haptics.error();
 *   
 *   // Selection changed
 *   haptics.selection();
 * 
 * Future Migration:
 *   When adding Capacitor, uncomment the Capacitor imports and
 *   swap to use native Haptics API for better feel.
 */

// ===========================================
// FUTURE: Uncomment when Capacitor is added
// ===========================================
// import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// ===========================================
// FEATURE DETECTION
// ===========================================
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

// User preference for haptics (can be disabled in settings)
let hapticsEnabled = true;

// ===========================================
// CURRENT: Web Vibration API implementation
// ===========================================
const haptics = {
  /**
   * Light impact - for subtle feedback
   * Use for: card flip, toggle switches, tab changes
   */
  light() {
    if (!hapticsEnabled || !canVibrate) return;
    navigator.vibrate(10);
  },

  /**
   * Medium impact - for standard interactions
   * Use for: button presses, selections
   */
  medium() {
    if (!hapticsEnabled || !canVibrate) return;
    navigator.vibrate(20);
  },

  /**
   * Heavy impact - for significant actions
   * Use for: confirmations, important state changes
   */
  heavy() {
    if (!hapticsEnabled || !canVibrate) return;
    navigator.vibrate(30);
  },

  /**
   * Success notification - positive feedback
   * Use for: correct quiz answer, action completed
   */
  success() {
    if (!hapticsEnabled || !canVibrate) return;
    navigator.vibrate([10, 50, 10, 50, 20]);
  },

  /**
   * Error notification - negative feedback
   * Use for: wrong quiz answer, action failed
   */
  error() {
    if (!hapticsEnabled || !canVibrate) return;
    navigator.vibrate([50, 100, 50]);
  },

  /**
   * Warning notification - attention needed
   * Use for: unsafe move selected, risk warning
   */
  warning() {
    if (!hapticsEnabled || !canVibrate) return;
    navigator.vibrate([30, 50, 30]);
  },

  /**
   * Selection changed - very subtle
   * Use for: scrolling through options, picker changes
   */
  selection() {
    if (!hapticsEnabled || !canVibrate) return;
    navigator.vibrate(5);
  },

  /**
   * Enable haptic feedback
   */
  enable() {
    hapticsEnabled = true;
  },

  /**
   * Disable haptic feedback
   */
  disable() {
    hapticsEnabled = false;
  },

  /**
   * Check if haptics are enabled
   */
  isEnabled() {
    return hapticsEnabled;
  },

  /**
   * Check if device supports haptics
   */
  isSupported() {
    return canVibrate;
  },
};

// ===========================================
// FUTURE: Capacitor Haptics implementation
// ===========================================
/*
const haptics = {
  async light() {
    if (!hapticsEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      // Fallback to vibration if native fails
      if (canVibrate) navigator.vibrate(10);
    }
  },

  async medium() {
    if (!hapticsEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      if (canVibrate) navigator.vibrate(20);
    }
  },

  async heavy() {
    if (!hapticsEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      if (canVibrate) navigator.vibrate(30);
    }
  },

  async success() {
    if (!hapticsEnabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      if (canVibrate) navigator.vibrate([10, 50, 10, 50, 20]);
    }
  },

  async error() {
    if (!hapticsEnabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      if (canVibrate) navigator.vibrate([50, 100, 50]);
    }
  },

  async warning() {
    if (!hapticsEnabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      if (canVibrate) navigator.vibrate([30, 50, 30]);
    }
  },

  async selection() {
    if (!hapticsEnabled) return;
    try {
      await Haptics.selectionChanged();
    } catch (e) {
      if (canVibrate) navigator.vibrate(5);
    }
  },

  enable() { hapticsEnabled = true; },
  disable() { hapticsEnabled = false; },
  isEnabled() { return hapticsEnabled; },
  isSupported() { return true; }, // Capacitor always supports on native
};
*/

export default haptics;

// ===========================================
// USAGE EXAMPLES IN COMPONENTS
// ===========================================
/*

// MoveCard.jsx - Card flip
import haptics from '@/utils/haptics';

const handleFlip = () => {
  haptics.light();
  setIsFlipped(!isFlipped);
};

// MoveCard.jsx - Hit type toggle
const cycleHitType = () => {
  haptics.selection();
  setHitType(prev => {
    if (prev === 'normal') return 'counter';
    if (prev === 'counter') return 'punishCounter';
    return 'normal';
  });
};

// QuizCard.jsx - Answer feedback
const handleAnswer = (isCorrect) => {
  if (isCorrect) {
    haptics.success();
  } else {
    haptics.error();
  }
};

// RiskWarning.jsx - Unsafe move warning
const showRiskWarning = () => {
  haptics.warning();
  // Show warning UI
};

*/
