import { ChevronUp, ChevronDown, X, Pencil, Plus } from 'lucide-react';
import MoveCard from '../Card/MoveCard';
import { getMovesByTag } from '../../utils/tacticalFilter';

// One category's section: header + grid of MoveCards filtered by tag.
// In edit mode, renders per-card controls (remove, reorder, edit tags) and
// a "+ Add move" tile at the end of the grid.

const TacticsCategorySection = ({
  category,
  characterMoves,
  ordering,
  editMode,
  onAddMove,        // (categoryId)
  onEditMove,       // (moveId)
  onRemoveMove,     // (moveId, categoryId)
  onMoveItem,       // (moveId, categoryId, direction: 'up' | 'down')
}) => {
  const moves = getMovesByTag(characterMoves, category.id, ordering);

  return (
    <section
      id={`tactics-${category.id}`}
      data-tactics-section={category.id}
      className="scroll-mt-32 md:scroll-mt-24"
    >
      <header className="mb-3 md:mb-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            {category.label}
          </h2>
          <span className="text-sm text-gray-500">
            {moves.length} {moves.length === 1 ? 'move' : 'moves'}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-1">{category.question}</p>
      </header>

      {moves.length === 0 && !editMode && (
        <p className="italic text-gray-500 text-sm py-4">
          Limited tools — see Unique Mechanics for character-specific options here.
        </p>
      )}

      {(moves.length > 0 || editMode) && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {moves.map((move, idx) => (
            <div key={move.id} className="relative">
              <MoveCard move={move} />

              {editMode && (
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <EditBtn
                    icon={ChevronUp}
                    label="Move up"
                    onClick={() => onMoveItem(move.id, category.id, 'up')}
                    disabled={idx === 0}
                  />
                  <EditBtn
                    icon={ChevronDown}
                    label="Move down"
                    onClick={() => onMoveItem(move.id, category.id, 'down')}
                    disabled={idx === moves.length - 1}
                  />
                  <EditBtn
                    icon={Pencil}
                    label="Edit tags"
                    onClick={() => onEditMove(move.id)}
                  />
                  <EditBtn
                    icon={X}
                    label="Remove from this category"
                    onClick={() => onRemoveMove(move.id, category.id)}
                    danger
                  />
                </div>
              )}
            </div>
          ))}

          {editMode && (
            <button
              onClick={() => onAddMove(category.id)}
              className="min-h-[120px] border-2 border-dashed border-gray-700 hover:border-purple-500 hover:bg-purple-600/5 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-purple-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add move</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
};

const EditBtn = ({ icon, label, onClick, disabled, danger }) => {
  const IconComp = icon;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-md backdrop-blur-sm transition-colors ${
        disabled
          ? 'bg-gray-800/60 text-gray-600 cursor-not-allowed'
          : danger
          ? 'bg-gray-900/80 text-red-400 hover:bg-red-700 hover:text-white'
          : 'bg-gray-900/80 text-gray-300 hover:bg-purple-600 hover:text-white'
      }`}
    >
      <IconComp className="w-3.5 h-3.5" />
    </button>
  );
};

export default TacticsCategorySection;
