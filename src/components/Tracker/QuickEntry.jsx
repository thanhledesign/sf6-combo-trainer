import { Trophy, X } from 'lucide-react';

// Big tap-target W/L buttons for in-the-moment logging. Mobile-first sizing.
// Optional haptic feedback on tap.

const QuickEntry = ({ onWin, onLoss, disabled }) => (
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={onWin}
      disabled={disabled}
      className="aspect-square sm:aspect-[2/1] flex flex-col items-center justify-center gap-2 rounded-2xl bg-green-600/20 border-2 border-green-500/40 text-green-300 hover:bg-green-600/30 hover:border-green-500 active:scale-[0.98] transition-all disabled:opacity-40"
      aria-label="Log a win"
    >
      <Trophy className="w-10 h-10 sm:w-12 sm:h-12" />
      <span className="text-3xl sm:text-4xl font-bold">+W</span>
      <span className="text-xs uppercase tracking-wide opacity-70">Win</span>
    </button>
    <button
      onClick={onLoss}
      disabled={disabled}
      className="aspect-square sm:aspect-[2/1] flex flex-col items-center justify-center gap-2 rounded-2xl bg-red-600/20 border-2 border-red-500/40 text-red-300 hover:bg-red-600/30 hover:border-red-500 active:scale-[0.98] transition-all disabled:opacity-40"
      aria-label="Log a loss"
    >
      <X className="w-10 h-10 sm:w-12 sm:h-12" />
      <span className="text-3xl sm:text-4xl font-bold">+L</span>
      <span className="text-xs uppercase tracking-wide opacity-70">Loss</span>
    </button>
  </div>
);

export default QuickEntry;
