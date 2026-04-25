import MoveCard from '../Card/MoveCard';
import { getMovesByTag } from '../../utils/tacticalFilter';

// One category's section: header + grid of MoveCards filtered by tag.
// Spec §6.2-§6.4: 1-col mobile (h-scroll), 2-col tablet, 3-col desktop.
// Spec §2.3: empty/sparse categories render the "Limited tools" italic note.

const TacticsCategorySection = ({ category, characterMoves }) => {
  const moves = getMovesByTag(characterMoves, category.id);

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

      {moves.length === 0 ? (
        <p className="italic text-gray-500 text-sm py-4">
          Limited tools — see Unique Mechanics for character-specific options here.
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {moves.map((move) => (
            <MoveCard key={move.id} move={move} />
          ))}
        </div>
      )}
    </section>
  );
};

export default TacticsCategorySection;
