import React from 'react';
import { X, Check } from 'lucide-react';

// Import thumbnails
import kenThumb from '../../assets/characters/kenThumbnail.png';
import terryThumb from '../../assets/characters/terryThumbnail.png';
import chunliThumb from '../../assets/characters/chunliThumbnail.png';
import lukeThumb from '../../assets/characters/lukeThumbnail.png';
import cammyThumb from '../../assets/characters/cammyThumbnail.png';
import maiThumb from '../../assets/characters/maiThumbnail.png';
import ryuThumb from '../../assets/characters/ryuThumbnail.png';

const thumbnailMap = {
  ken: kenThumb,
  terry: terryThumb,
  chunli: chunliThumb,
  luke: lukeThumb,
  cammy: cammyThumb,
  mai: maiThumb,
  ryu: ryuThumb
};

const CharacterSelectorModal = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentCharacterId, 
  characters 
}) => {
  if (!isOpen) return null;

  // Sort characters alphabetically
  const sortedCharacters = [...characters].sort((a, b) => 
    a.character.displayName.localeCompare(b.character.displayName)
  );

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Select Character</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Character Grid */}
          <div className="p-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sortedCharacters.map((charData) => {
                const charId = charData.character.id;
                const isSelected = charId === currentCharacterId;
                const thumbnail = thumbnailMap[charId];
                
                return (
                  <button
                    key={charId}
                    onClick={() => onSelect(charId)}
                    className={`
                      relative flex flex-col items-center p-3 rounded-lg transition-all
                      border-2 hover:scale-105
                      ${isSelected 
                        ? 'bg-purple-600/30 border-purple-500' 
                        : 'bg-gray-700/50 border-transparent hover:bg-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    {/* Character Portrait */}
                    <div className={`
                      w-16 h-16 rounded-full overflow-hidden mb-2 
                      border-2 ${isSelected ? 'border-purple-400' : 'border-gray-600'}
                      bg-gray-700
                    `}>
                      {thumbnail ? (
                        <img 
                          src={thumbnail} 
                          alt={charData.character.displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg font-bold">
                          {charData.character.displayName.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    {/* Character Name */}
                    <span className={`
                      text-sm font-medium truncate w-full text-center
                      ${isSelected ? 'text-purple-300' : 'text-gray-300'}
                    `}>
                      {charData.character.displayName}
                    </span>
                    
                    {/* Character Archetype */}
                    <span className="text-xs text-gray-500 capitalize">
                      {charData.character.archetype}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-800/50">
            <button
              onClick={() => onSelect(null)}
              className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CharacterSelectorModal;
