import { useEffect, useRef, useState } from 'react';

// Tinder-style swipe card. Pointer events handle both touch and mouse.
// - Drag right = win (resolves with 'W')
// - Drag left  = loss (resolves with 'L')
// - Threshold to commit, otherwise snap back
// - Visual feedback: rotation, opacity, color tint based on drag direction

const SWIPE_THRESHOLD = 100;  // px past which a drag commits
const MAX_ROTATE = 18;         // deg at full swipe distance

const SwipeCard = ({ children, onSwipe, disabled = false }) => {
  const cardRef = useRef(null);
  const startXRef = useRef(null);
  const [drag, setDrag] = useState(0);
  const [animating, setAnimating] = useState(false);

  const handlePointerDown = (e) => {
    if (disabled || animating) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
  };

  const handlePointerMove = (e) => {
    if (startXRef.current == null) return;
    const dx = e.clientX - startXRef.current;
    setDrag(dx);
  };

  const commit = (direction) => {
    setAnimating(true);
    setDrag(direction === 'W' ? 800 : -800);
    setTimeout(() => {
      onSwipe(direction);
      setDrag(0);
      setAnimating(false);
    }, 200);
  };

  const handlePointerUp = (e) => {
    if (startXRef.current == null) return;
    const dx = e.clientX - startXRef.current;
    startXRef.current = null;
    if (dx > SWIPE_THRESHOLD) commit('W');
    else if (dx < -SWIPE_THRESHOLD) commit('L');
    else setDrag(0);
  };

  // Keyboard accessibility: ← / →
  useEffect(() => {
    if (disabled) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') commit('W');
      else if (e.key === 'ArrowLeft') commit('L');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // commit closes over animation state but is stable enough for arrow-key UX
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const rotation = Math.max(-MAX_ROTATE, Math.min(MAX_ROTATE, (drag / 200) * MAX_ROTATE));
  const opacity  = 1 - Math.min(0.4, Math.abs(drag) / 600);
  const tint = drag > 30 ? 'win' : drag < -30 ? 'loss' : 'none';

  return (
    <div className="relative select-none touch-none">
      {/* Tint overlays — labels appear during drag */}
      <div className={`pointer-events-none absolute inset-0 rounded-3xl flex items-center justify-end pr-8 transition-opacity duration-100 ${tint === 'win' ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-5xl font-black text-green-400 transform rotate-12 tracking-wider">WIN</span>
      </div>
      <div className={`pointer-events-none absolute inset-0 rounded-3xl flex items-center justify-start pl-8 transition-opacity duration-100 ${tint === 'loss' ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-5xl font-black text-red-400 transform -rotate-12 tracking-wider">LOSS</span>
      </div>

      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${drag}px) rotate(${rotation}deg)`,
          opacity,
          transition: startXRef.current == null ? 'transform 0.25s ease-out, opacity 0.25s ease-out' : 'none',
        }}
        className={`relative cursor-grab active:cursor-grabbing ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeCard;
