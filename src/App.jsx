import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Search, ChevronDown, Menu, X } from 'lucide-react';
import CharacterCards from './components/CharacterCards';
import MoveCard from './components/Card/MoveCard';
import PunishCalculator from './components/Punish/PunishCalculator';
import MoveBrowser from './components/Browse/MoveBrowser';
import SearchResults from './components/Search/SearchResults';
import CharacterSelectorModal from './components/Navigation/CharacterSelectorModal';
import kenData from './data/characters/ken.json';
import terryData from './data/characters/terry.json';
import chunliData from './data/characters/chunli.json';
import lukeData from './data/characters/luke.json';
import cammyData from './data/characters/cammy.json';
import maiData from './data/characters/mai.json';
import ryuData from './data/characters/ryu.json';

// Character thumbnail imports for nav
import kenThumb from './assets/characters/kenThumbnail.png';
import terryThumb from './assets/characters/terryThumbnail.png';
import chunliThumb from './assets/characters/chunliThumbnail.png';
import lukeThumb from './assets/characters/lukeThumbnail.png';
import cammyThumb from './assets/characters/cammyThumbnail.png';
import maiThumb from './assets/characters/maiThumbnail.png';
import ryuThumb from './assets/characters/ryuThumbnail.png';

// Character data map for easy lookup
const characterMap = {
  ken: kenData,
  terry: terryData,
  chunli: chunliData,
  luke: lukeData,
  cammy: cammyData,
  mai: maiData,
  ryu: ryuData
};

const thumbnailMap = {
  ken: kenThumb,
  terry: terryThumb,
  chunli: chunliThumb,
  luke: lukeThumb,
  cammy: cammyThumb,
  mai: maiThumb,
  ryu: ryuThumb
};

const allCharacters = Object.values(characterMap);

// Wrapper component for MoveBrowser that gets character from URL
const MoveBrowserWrapper = ({ onCharacterChange }) => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  
  const characterData = characterMap[characterId];
  
  // If invalid character ID, redirect to ken
  useEffect(() => {
    if (characterId && !characterData) {
      navigate('/browse/ken');
    } else if (!characterId) {
      navigate('/browse/ken');
    }
  }, [characterId, characterData, navigate]);
  
  if (!characterData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }
  
  return (
    <MoveBrowser 
      characterData={characterData} 
      allCharacters={allCharacters}
      onCharacterChange={onCharacterChange}
    />
  );
};

// Wrapper component for PunishCalculator that gets character from URL
const PunishCalculatorWrapper = ({ onCharacterChange }) => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  
  const characterData = characterId ? characterMap[characterId] : null;
  
  return (
    <PunishCalculator 
      characterData={characterData}
      allCharacters={allCharacters}
      onCharacterChange={onCharacterChange}
    />
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  // Handle character click from CharacterCards page
  const handleCharacterBrowse = (character) => {
    navigate(`/browse/${character.id}`);
  };

  // Handle character selection from modal
  const handleCharacterSelect = (characterId) => {
    if (characterId === null) {
      setSelectedCharacterId(null);
      setIsCharacterModalOpen(false);
    } else {
      setSelectedCharacterId(characterId);
      setIsCharacterModalOpen(false);
      navigate(`/browse/${characterId}`);
    }
  };

  // Handle character change from within a page
  const handleCharacterChange = (characterId) => {
    if (location.pathname.startsWith('/browse')) {
      navigate(`/browse/${characterId}`);
    } else if (location.pathname.startsWith('/punish')) {
      navigate(`/punish/${characterId}`);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      setSearchQuery(searchInputValue.trim());
      setIsSearchOpen(false);
      navigate('/search');
    }
  };

  // Toggle search dropdown
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchInputValue('');
    }
  };

  // Get current character data for nav display
  const currentCharacter = selectedCharacterId ? characterMap[selectedCharacterId] : null;
  const currentThumbnail = selectedCharacterId ? thumbnailMap[selectedCharacterId] : null;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger (mobile) + Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button - Mobile Only */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Logo */}
              <h1 
                className="text-xl font-bold text-white cursor-pointer hover:text-purple-400 transition-colors"
                onClick={() => navigate('/')}
              >
                SF6 Trainer
              </h1>
            </div>
            
            {/* Center: Nav Links - Desktop Only */}
            <div className="hidden md:flex items-center gap-2">
              <NavButton 
                active={location.pathname === '/' || location.pathname === '/characters'}
                onClick={() => navigate('/characters')}
              >
                Characters
              </NavButton>
              <NavButton 
                active={location.pathname.startsWith('/punish')}
                onClick={() => navigate(`/punish/${selectedCharacterId || 'ken'}`)}
              >
                Punish Calculator
              </NavButton>
            </div>
            
            {/* Right: Search + Character Selector */}
            <div className="flex items-center gap-2">
              {/* Search Button + Dropdown */}
              <div className="relative" ref={searchContainerRef}>
                <button
                  onClick={toggleSearch}
                  className={`
                    p-3 rounded-lg transition-all border
                    ${isSearchOpen || location.pathname === '/search'
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Floating Search Dropdown */}
                {isSearchOpen && (
                  <>
                    {/* Mobile: Fixed position, full width with margins */}
                    <div className="sm:hidden fixed left-4 right-4 top-20 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 z-[60]">
                      <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search moves..."
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          Search by move name, input, or description
                        </p>
                        <button
                          type="submit"
                          disabled={!searchInputValue.trim()}
                          className={`
                            w-full mt-3 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2
                            ${searchInputValue.trim()
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }
                          `}
                        >
                          <Search className="w-4 h-4" />
                          Search All Characters
                        </button>
                      </form>
                    </div>
                    {/* Desktop: Absolute positioned dropdown */}
                    <div className="hidden sm:block absolute right-0 top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 z-[60]">
                      <form onSubmit={handleSearchSubmit}>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search moves (e.g., 2LP, Shoryuken...)"
                            value={searchInputValue}
                            onChange={(e) => setSearchInputValue(e.target.value)}
                            className="w-full bg-gray-700 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          Search by move name, input, or description
                        </p>
                        <button
                          type="submit"
                          disabled={!searchInputValue.trim()}
                          className={`
                            w-full mt-3 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2
                            ${searchInputValue.trim()
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }
                          `}
                        >
                          <Search className="w-4 h-4" />
                          Search All Characters
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>

              {/* Character Selector Button */}
              <button
                onClick={() => setIsCharacterModalOpen(true)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                  border hover:scale-105
                  ${selectedCharacterId 
                    ? 'bg-purple-600/20 border-purple-500/50 hover:bg-purple-600/30' 
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  }
                `}
              >
                {selectedCharacterId && currentThumbnail ? (
                  <>
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-400/50 bg-gray-700">
                      <img 
                        src={currentThumbnail} 
                        alt={currentCharacter?.character?.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-white hidden sm:block">
                      {currentCharacter?.character?.displayName}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-500 bg-gray-700/50 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">?</span>
                    </div>
                    <span className="text-sm font-medium text-gray-400 hidden sm:block">
                      Select
                    </span>
                  </>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Mobile Hamburger Menu Dropdown - Absolutely positioned */}
          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-gray-800 border-b border-gray-700 shadow-xl z-50">
              <div className="px-4 py-3 flex flex-col gap-1">
                <MobileNavButton 
                  active={location.pathname === '/' || location.pathname === '/characters'}
                  onClick={() => {
                    navigate('/characters');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Characters
                </MobileNavButton>
                <MobileNavButton 
                  active={location.pathname.startsWith('/punish')}
                  onClick={() => {
                    navigate(`/punish/${selectedCharacterId || 'ken'}`);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Punish Calculator
                </MobileNavButton>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Click overlay to close mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Character Selector Modal */}
      <CharacterSelectorModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        onSelect={handleCharacterSelect}
        currentCharacterId={selectedCharacterId}
        characters={allCharacters}
      />

      {/* Routes */}
      <Routes>
        {/* Home / Characters */}
        <Route path="/" element={
          <CharacterCards 
            onCharacterSelect={handleCharacterBrowse} 
            selectedCharacterId={selectedCharacterId}
          />
        } />
        <Route path="/characters" element={
          <CharacterCards 
            onCharacterSelect={handleCharacterBrowse} 
            selectedCharacterId={selectedCharacterId}
          />
        } />
        
        {/* Browse Moves - with character ID in URL */}
        <Route path="/browse" element={
          <MoveBrowserWrapper onCharacterChange={handleCharacterChange} />
        } />
        <Route path="/browse/:characterId" element={
          <MoveBrowserWrapper onCharacterChange={handleCharacterChange} />
        } />
        
        {/* Punish Calculator - with optional character ID */}
        <Route path="/punish" element={
          <PunishCalculatorWrapper onCharacterChange={handleCharacterChange} />
        } />
        <Route path="/punish/:characterId" element={
          <PunishCalculatorWrapper onCharacterChange={handleCharacterChange} />
        } />
        
        {/* Search */}
        <Route path="/search" element={
          <SearchResults 
            searchQuery={searchQuery}
            allCharacters={allCharacters}
            onBack={() => navigate('/characters')}
            onNewSearch={(query) => setSearchQuery(query)}
          />
        } />
      </Routes>
    </div>
  );
}

// Desktop Nav Button
const NavButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
      ${active 
        ? 'bg-purple-600 text-white' 
        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
      }
    `}
  >
    {children}
  </button>
);

// Mobile Nav Button (full width)
const MobileNavButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full px-4 py-3 rounded-lg font-medium transition-all text-left
      ${active 
        ? 'bg-purple-600 text-white' 
        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
      }
    `}
  >
    {children}
  </button>
);

export default App;
