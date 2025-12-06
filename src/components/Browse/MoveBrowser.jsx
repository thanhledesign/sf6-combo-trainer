import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, LayoutGrid, Rows3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MoveCard from '../Card/MoveCard';

// Import thumbnails
import kenThumbnail from '../../assets/characters/kenThumbnail.png';
import terryThumbnail from '../../assets/characters/terryThumbnail.png';
import chunliThumbnail from '../../assets/characters/chunliThumbnail.png';
import lukeThumbnail from '../../assets/characters/lukeThumbnail.png';
import cammyThumbnail from '../../assets/characters/cammyThumbnail.png';
import maiThumbnail from '../../assets/characters/maiThumbnail.png';
import ryuThumbnail from '../../assets/characters/ryuThumbnail.png';

const thumbnails = {
  ken: kenThumbnail,
  terry: terryThumbnail,
  chunli: chunliThumbnail,
  luke: lukeThumbnail,
  cammy: cammyThumbnail,
  mai: maiThumbnail,
  ryu: ryuThumbnail,
};

const MoveBrowser = ({ characterData, allCharacters = [], onCharacterChange }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [safetyFilter, setSafetyFilter] = useState('all');
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [mobileColumns, setMobileColumns] = useState(() => {
    // Default to compact (2) on mobile, full (1) on larger screens
    return window.innerWidth < 768 ? 2 : 1;
  });

  // Handle sticky subnav
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsSticky(scrollTop > 300); // Adjust threshold as needed
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to content area when category changes (below sticky nav)
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
    // Scroll to just below where sticky nav would be (nav height ~64px + some padding)
    // This keeps the category nav visible without scrolling past it
    window.scrollTo({ top: 280, behavior: 'smooth' });
  };

  if (!characterData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">No character selected</p>
      </div>
    );
  }

  const { character, moves } = characterData;
  const thumbnail = thumbnails[character?.id];

  // Get all moves as array
  const allMoves = useMemo(() => Object.values(moves || {}), [moves]);

  // Category definitions
  const categories = [
    { id: 'all', name: 'All Moves', count: allMoves.length },
    { id: 'normal', name: 'Normals', count: allMoves.filter(m => m.category === 'normal').length },
    { id: 'unique', name: 'Unique', count: allMoves.filter(m => m.category === 'unique').length },
    { id: 'special', name: 'Special', count: allMoves.filter(m => m.category === 'special').length },
    { id: 'super', name: 'Supers', count: allMoves.filter(m => m.category === 'super').length },
    { id: 'throw', name: 'Throws', count: allMoves.filter(m => m.category === 'throw').length },
    { id: 'common', name: 'Common', count: allMoves.filter(m => m.category === 'common').length },
  ];

  const currentCategory = categories.find(c => c.id === selectedCategory) || categories[0];

  // Filter moves
  const filteredMoves = useMemo(() => {
    return allMoves.filter(move => {
      // Category filter
      if (selectedCategory !== 'all' && move.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = move.displayName?.toLowerCase().includes(query);
        const matchesInput = move.input?.toLowerCase().includes(query);
        const matchesNotation = move.notation?.toLowerCase().includes(query);
        if (!matchesName && !matchesInput && !matchesNotation) {
          return false;
        }
      }

      // Safety filter
      if (safetyFilter !== 'all') {
        const onBlock = move.opponentPerspective?.frameAdvantage?.onBlock;
        if (safetyFilter === 'safe' && (onBlock === null || onBlock < -3)) return false;
        if (safetyFilter === 'unsafe' && (onBlock === null || onBlock >= -3)) return false;
        if (safetyFilter === 'plus' && (onBlock === null || onBlock <= 0)) return false;
      }

      return true;
    });
  }, [allMoves, selectedCategory, searchQuery, safetyFilter]);

  // Group moves by category for display
  const groupedMoves = useMemo(() => {
    if (selectedCategory !== 'all') {
      return { [selectedCategory]: filteredMoves };
    }
    
    const groups = {};
    filteredMoves.forEach(move => {
      const cat = move.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(move);
    });
    return groups;
  }, [filteredMoves, selectedCategory]);

  const categoryLabels = {
    normal: 'Normal Moves',
    unique: 'Unique Attacks',
    special: 'Special Moves',
    super: 'Super Arts',
    throw: 'Throws',
    common: 'Common Moves',
    other: 'Other'
  };

  // Desktop Category Buttons
  const DesktopCategoryNav = () => (
    <div className="hidden md:flex flex-wrap gap-2 justify-center">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => handleCategoryChange(cat.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === cat.id
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {cat.name}
          <span className="ml-1 text-xs opacity-70">({cat.count})</span>
        </button>
      ))}
    </div>
  );

  // Mobile Category Dropdown
  const MobileCategoryDropdown = () => (
    <div className="md:hidden relative">
      <button
        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
      >
        <span>
          {currentCategory.name}
          <span className="ml-2 text-xs text-gray-400">({currentCategory.count})</span>
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {showCategoryDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Category Subnav Component (for sticky)
  const StickyNav = () => (
    <div className="fixed top-[75px] left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-40 py-3">
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Desktop: buttons */}
        <div className="hidden md:flex flex-wrap gap-2 justify-center">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {cat.name}
              <span className="ml-1 text-xs opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
        {/* Mobile: dropdown */}
        <MobileCategoryDropdown />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sticky Category Nav (shows when scrolled) */}
      {isSticky && <StickyNav />}

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Header with Character Info */}
        <div className="text-center mb-8">
          {/* Character Thumbnail with border */}
          {thumbnail && (
            <div className="w-[88px] h-[88px] mx-auto mb-4 rounded-full overflow-hidden border-2 border-gray-400">
              <img 
                src={thumbnail} 
                alt={character?.displayName} 
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Character Name with Dropdown */}
          <div className="relative inline-block">
            <button
              onClick={() => setShowCharacterDropdown(!showCharacterDropdown)}
              className="flex items-center gap-2 text-3xl font-bold text-white hover:text-purple-400 transition-colors"
            >
              {character?.displayName || character?.name}
              <ChevronDown className={`w-6 h-6 transition-transform ${showCharacterDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Character Dropdown */}
            {showCharacterDropdown && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 min-w-[200px]">
                {allCharacters
                  .sort((a, b) => a.character?.displayName?.localeCompare(b.character?.displayName))
                  .map(char => (
                  <button
                    key={char.character?.id}
                    onClick={() => {
                      if (onCharacterChange) {
                        onCharacterChange(char.character?.id);
                      }
                      setShowCharacterDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3 ${
                      char.character?.id === character?.id ? 'bg-purple-600/20 text-purple-400' : 'text-gray-300'
                    }`}
                  >
                    {thumbnails[char.character?.id] && (
                      <img 
                        src={thumbnails[char.character?.id]} 
                        alt={char.character?.displayName}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-400"
                      />
                    )}
                    {char.character?.displayName || char.character?.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Character Bio */}
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
            {character?.bio || character?.description}
          </p>

          {/* Vitals */}
          {character?.vitals && (
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-sm">
              <span className="text-gray-500">
                <span className="text-gray-400">Height:</span> {character.vitals.height}
              </span>
              <span className="text-gray-500">
                <span className="text-gray-400">Weight:</span> {character.vitals.weight}
              </span>
              <span className="text-gray-500">
                <span className="text-gray-400">Likes:</span> {character.vitals.likes}
              </span>
              <span className="text-gray-500">
                <span className="text-gray-400">Hates:</span> {character.vitals.hates}
              </span>
            </div>
          )}
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search moves..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Safety Filter */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'safe', label: 'Safe' },
              { id: 'unsafe', label: 'Unsafe' },
              { id: 'plus', label: 'Plus' },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setSafetyFilter(filter.id)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  safetyFilter === filter.id
                    ? filter.id === 'safe' ? 'bg-green-600 text-white' :
                      filter.id === 'unsafe' ? 'bg-red-600 text-white' :
                      filter.id === 'plus' ? 'bg-blue-600 text-white' :
                      'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Navigation (static position) */}
        <div className="mb-8">
          <DesktopCategoryNav />
          <MobileCategoryDropdown />
        </div>

        {/* Results Count + View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400">
            Showing {filteredMoves.length} move{filteredMoves.length !== 1 ? 's' : ''}
          </p>
          
          {/* Mobile View Toggle */}
          <div className="flex md:hidden items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMobileColumns(1)}
              className={`p-2 rounded transition-colors ${
                mobileColumns === 1 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Single column"
            >
              <Rows3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileColumns(2)}
              className={`p-2 rounded transition-colors ${
                mobileColumns === 2 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
              title="Two columns"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Move Cards by Category */}
        {Object.entries(groupedMoves).map(([category, moves]) => (
          <div key={category} className="mb-8">
            <h2 className="text-white mb-4 border-b border-gray-700 pb-2">
              {categoryLabels[category] || category}
            </h2>
            <div className={`grid gap-4 md:gap-6 ${
              mobileColumns === 2 
                ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {moves.map(move => (
                <MoveCard key={move.id} move={move} compact={mobileColumns === 2} />
              ))}
            </div>
          </div>
        ))}

        {filteredMoves.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No moves found matching your filters</p>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showCharacterDropdown || showCategoryDropdown) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowCharacterDropdown(false);
            setShowCategoryDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default MoveBrowser;
