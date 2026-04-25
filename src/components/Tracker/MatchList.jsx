import { useNavigate } from 'react-router-dom';
import { ExternalLink, Trash2, Pencil } from 'lucide-react';

// Recent matches list with per-row Trainer bridge link (opponent → /browse).
const MatchList = ({ matches, characterMap, onEdit, onDelete }) => {
  const navigate = useNavigate();

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No matches yet. Tap +W or +L to log your first.
      </div>
    );
  }

  const fmt = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const charName = (id) => {
    if (!id || !characterMap) return null;
    return characterMap[id]?.character?.displayName || characterMap[id]?.character?.name || id;
  };

  return (
    <ul className="divide-y divide-gray-800">
      {matches.map((m) => (
        <li key={m.id} className="py-2.5 flex items-center gap-3">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              m.result === 'W' ? 'bg-green-600/30 text-green-300' : 'bg-red-600/30 text-red-300'
            }`}
            aria-label={m.result === 'W' ? 'Win' : 'Loss'}
          >
            {m.result}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">
              {m.yourCharacter && m.opponentCharacter ? (
                <>
                  <span className="text-gray-300">{charName(m.yourCharacter)}</span>
                  <span className="text-gray-600 mx-1">vs</span>
                  <span className="text-gray-300">{charName(m.opponentCharacter)}</span>
                </>
              ) : (
                <span className="text-gray-500 italic">Quick entry</span>
              )}
            </div>
            {(m.notes || m.lossTags?.length) && (
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {m.lossTags?.length > 0 && <span className="mr-2">{m.lossTags.length} tag{m.lossTags.length > 1 ? 's' : ''}</span>}
                {m.notes && <span>{m.notes}</span>}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-500 tabular-nums shrink-0">{fmt(m.timestamp)}</span>
          {m.opponentCharacter && (
            <button
              onClick={() => navigate(`/browse/${m.opponentCharacter}`)}
              className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-purple-600/10 flex items-center gap-1 shrink-0"
              title={`Study ${charName(m.opponentCharacter)}'s moves`}
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Study</span>
            </button>
          )}
          <button
            onClick={() => onEdit?.(m)}
            aria-label="Edit match"
            className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-gray-800 shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete?.(m)}
            aria-label="Delete match"
            className="p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-red-900/30 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
};

export default MatchList;
