/**
 * SF6 Combo Trainer - Swipe Gesture Hook
 * 
 * Purpose: Add swipe gesture support for card interactions.
 * Swipe left/right to flip cards, swipe up/down for other actions.
 * 
 * Usage:
 *   import { useSwipeGesture } from '@/hooks/useSwipeGesture';
 *   
 *   function MoveCard({ move }) {
 *     const [isFlipped, setIsFlipped] = useState(false);
 *     
 *     const swipeHandlers = useSwipeGesture({
 *       onSwipeLeft: () => setIsFlipped(true),
 *       onSwipeRight: () => setIsFlipped(false),
 *       threshold: 50,
 *     });
 *     
 *     return (
 *       <div {...swipeHandlers}>
 *         {/* Card content *\/}
 *       </div>
 *     );
 *   }
 */

import { useRef, useCallback } from 'react';

/**
 * Hook for detecting swipe gestures
 * 
 * @param {object} options - Configuration options
 * @param {function} options.onSwipeLeft - Called on left swipe
 * @param {function} options.onSwipeRight - Called on right swipe
 * @param {function} options.onSwipeUp - Called on up swipe
 * @param {function} options.onSwipeDown - Called on down swipe
 * @param {number} options.threshold - Minimum distance to trigger (default: 50px)
 * @param {number} options.velocityThreshold - Minimum velocity for quick swipes (default: 0.5)
 * @param {boolean} options.preventScrollOnSwipe - Prevent vertical scroll during horizontal swipe
 * @returns {object} - Event handlers to spread on element
 */
export function useSwipeGesture(options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.5,
    preventScrollOnSwipe = true,
  } = options;

  // Track touch state
  const touchStart = useRef(null);
  const touchStartTime = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStart.current || !preventScrollOnSwipe) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    // If horizontal swipe is dominant, prevent vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
    }
  }, [preventScrollOnSwipe]);

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStartTime.current;

    // Calculate velocity (pixels per millisecond)
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    // Determine if swipe meets threshold
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

    // Check for quick swipes (high velocity, lower distance threshold)
    const isQuickSwipe = velocityX > velocityThreshold || velocityY > velocityThreshold;
    const effectiveThreshold = isQuickSwipe ? threshold * 0.5 : threshold;

    // Horizontal swipes
    if (isHorizontalSwipe && Math.abs(deltaX) >= effectiveThreshold) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    // Vertical swipes
    if (isVerticalSwipe && Math.abs(deltaY) >= effectiveThreshold) {
      if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      } else if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      }
    }

    // Reset
    touchStart.current = null;
    touchStartTime.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold]);

  const handleTouchCancel = useCallback(() => {
    touchStart.current = null;
    touchStartTime.current = null;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}

/**
 * Simpler version - just horizontal swipes for card flip
 * 
 * @param {function} onSwipeLeft - Called on left swipe
 * @param {function} onSwipeRight - Called on right swipe
 * @returns {object} - Event handlers
 */
export function useHorizontalSwipe(onSwipeLeft, onSwipeRight) {
  return useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold: 50,
  });
}

/**
 * Hook for detecting tap vs long press
 * Useful for distinguishing between flip and context menu
 * 
 * @param {function} onTap - Called on quick tap
 * @param {function} onLongPress - Called on long press
 * @param {number} longPressDelay - Time to trigger long press (default: 500ms)
 */
export function useTapAndLongPress(onTap, onLongPress, longPressDelay = 500) {
  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  const handleTouchStart = useCallback(() => {
    isLongPress.current = false;
    
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress?.();
    }, longPressDelay);
  }, [onLongPress, longPressDelay]);

  const handleTouchEnd = useCallback(() => {
    clearTimeout(timerRef.current);
    
    if (!isLongPress.current) {
      onTap?.();
    }
  }, [onTap]);

  const handleTouchCancel = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };
}

// ===========================================
// EXAMPLE INTEGRATION WITH MOVECARD
// ===========================================
/*

// In MoveCard.jsx:

import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import haptics from '@/utils/haptics';

function MoveCard({ move }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  const handleFlipToBack = () => {
    if (!isFlipped) {
      haptics.light();
      setIsFlipped(true);
    }
  };
  
  const handleFlipToFront = () => {
    if (isFlipped) {
      haptics.light();
      setIsFlipped(false);
    }
  };
  
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleFlipToBack,   // Swipe left = show back (opponent view)
    onSwipeRight: handleFlipToFront, // Swipe right = show front (your view)
    threshold: 50,
  });
  
  return (
    <div 
      className="relative preserve-3d cursor-pointer"
      onClick={() => {
        haptics.light();
        setIsFlipped(!isFlipped);
      }}
      {...swipeHandlers}
    >
      <div className={`
        transition-transform duration-500
        ${isFlipped ? 'rotate-y-180' : ''}
      `}>
        {/* Front and back sides *\/}
      </div>
    </div>
  );
}

*/

export default useSwipeGesture;
