import React, { useState, useMemo, useEffect } from 'react';
import { Search, ArrowLeft, X, ChevronDown } from 'lucide-react';
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

const SearchResults = ({ searchQuery, allCharacters, onBack, onNewSearch }) => {
  const navigate = useNavigate();
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  const [safetyFilter, setSafetyFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSticky, setIsSticky] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Auto-trigger search if searchQuery prop is provided
  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      setLocalQuery(searchQuery);
      setHasSearched(true);
    }
  }, [searchQuery]);

  // Handle sticky subnav
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsSticky(scrollTop > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search across all characters
  const results = useMemo(() => {
    if (!localQuery.trim() || !hasSearched) return [];

    const query = localQuery.toLowerCase();
    const matches = [];

    allCharacters.forEach(charData => {
      const charName = charData.character?.displayName || charData.character?.name;
      const charId = charData.character?.id;
      
      Object.values(charData.moves || {}).forEach(move => {
        const matchesName = move.displayName?.toLowerCase().includes(query);
        const matchesInput = move.input?.toLowerCase().includes(query);
        const matchesNotation = move.notation?.toLowerCase().includes(query);
        const matchesShortName = move.shortName?.toLowerCase().includes(query);
        const matchesTactical = move.yourPerspective?.tacticalUse?.toLowerCase().includes(query);

        if (matchesName || matchesInput || matchesNotation || matchesShortName || matchesTactical) {
          matches.push({
            ...move,
            characterName: charName,
            characterId: charId
          });
        }
      });
    });

    return matches;
  }, [localQuery, allCharacters, hasSearched]);

  // Apply filters
  const filteredResults = useMemo(() => {
    return results.filter(move => {
      // Category filter
      if (selectedCategory !== 'all' && move.category !== selectedCategory) {
        return false;
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
  }, [results, selectedCategory, safetyFilter]);

  // Group by character
  const groupedResults = useMemo(() => {
    const groups = {};
    filteredResults.forEach(move => {
      const charName = move.characterName || 'Unknown';
      if (!groups[charName]) {
        groups[charName] = {
          moves: [],
          characterId: move.characterId
        };
      }
      groups[charName].moves.push(move);
    });
    return groups;
  }, [filteredResults]);

  // Get category counts from results
  const categories = useMemo(() => {
    const counts = {
      all: results.length,
      normal: results.filter(m => m.category === 'normal').length,
      unique: results.filter(m => m.category === 'unique').length,
      special: results.filter(m => m.category === 'special').length,
      super: results.filter(m => m.category === 'super').length,
      throw: results.filter(m => m.category === 'throw').length,
      common: results.filter(m => m.category === 'common').length,
    };

    return [
      { id: 'all', name: 'All Moves', count: counts.all },
      { id: 'normal', name: 'Normals', count: counts.normal },
      { id: 'unique', name: 'Unique', count: counts.unique },
      { id: 'special', name: 'Special', count: counts.special },
      { id: 'super', name: 'Supers', count: counts.super },
      { id: 'throw', name: 'Throws', count: counts.throw },
      { id: 'common', name: 'Common', count: counts.common },
    ];
  }, [results]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setHasSearched(true);
      if (onNewSearch) {
        onNewSearch(localQuery.trim());
      }
    }
  };

  const handleCharacterClick = (characterId) => {
    navigate(`/browse/${characterId}`);
  };

  // Handle category change with scroll
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
    window.scrollTo({ top: 280, behavior: 'smooth' });
  };

  // Get current category name
  const currentCategory = categories.find(c => c.id === selectedCategory);

  // Desktop Category Nav Component
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

  // Mobile Category Dropdown Component
  const MobileCategoryDropdown = () => (
    <div className="md:hidden relative">
      <button
        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 rounded-lg border border-gray-700"
      >
        <span className="text-white font-medium">
          {currentCategory?.name || 'All Moves'}
          <span className="ml-1 text-xs text-gray-400">({currentCategory?.count || 0})</span>
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {showCategoryDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowCategoryDropdown(false)}
          />
          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
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
        </>
      )}
    </div>
  );

  // Sticky Nav Component
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
      {/* Sticky Category Nav (shows when scrolled and has results) */}
      {isSticky && hasSearched && results.length > 0 && <StickyNav />}

      <div className={`max-w-[1600px] mx-auto px-4 py-8 ${isSticky && hasSearched && results.length > 0 ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Search Results</h1>
            {hasSearched && (
              <p className="text-gray-400">
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} 
                {localQuery && ` for "${localQuery}"`}
              </p>
            )}
          </div>
        </div>

        {/* Search Bar and Filters */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search all moves..."
                className="w-full bg-gray-800 text-white pl-10 pr-10 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalQuery('');
                    setHasSearched(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Search
            </button>

            {/* Safety Filters */}
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'safe', label: 'Safe' },
                { id: 'unsafe', label: 'Unsafe' },
                { id: 'plus', label: 'Plus' },
              ].map(filter => (
                <button
                  key={filter.id}
                  type="button"
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
        </form>

        {/* Category Navigation (only show after search with results) */}
        {hasSearched && results.length > 0 && (
          <div className="mb-8">
            <DesktopCategoryNav />
            <MobileCategoryDropdown />
          </div>
        )}

        {/* Results grouped by character */}
        {hasSearched && Object.entries(groupedResults)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([charName, { moves, characterId }]) => (
          <div key={charName} className="mb-8">
            <h2 className="text-white mb-4 flex items-center gap-3 border-b border-gray-700 pb-2">
              {/* Character Thumbnail with border */}
              {thumbnails[characterId] && (
                <img 
                  src={thumbnails[characterId]} 
                  alt={charName}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-400"
                />
              )}
              {/* Clickable Character Name */}
              <button
                onClick={() => handleCharacterClick(characterId)}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {charName}
              </button>
              <span className="text-gray-500 text-sm font-normal">({moves.length} matches)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {moves.map(move => (
                <MoveCard 
                  key={`${move.characterId}-${move.id}`} 
                  move={move} 
                  showCharacter={true}
                  characterName={charName}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Empty State - No results found */}
        {hasSearched && filteredResults.length === 0 && localQuery && (
          <div className="text-center py-16 bg-gray-800 rounded-xl">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-2">No moves found for "{localQuery}"</p>
            <p className="text-gray-500">
              Try searching by move name, input notation, or description
            </p>
          </div>
        )}

        {/* Initial State - Before any search */}
        {!hasSearched && (
          <div className="text-center py-16 bg-gray-800 rounded-xl">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-2">Search for moves across all characters</p>
            <p className="text-gray-500">
              Enter a move name, input notation, or keyword to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
