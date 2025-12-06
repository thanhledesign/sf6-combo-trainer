import React, { useState } from 'react';
import { ChevronRight, Zap, Shield, Sword, Star, LayoutGrid, Rows3 } from 'lucide-react';
import kenThumbnail from '../assets/characters/kenThumbnail.png';
import terryThumbnail from '../assets/characters/terryThumbnail.png';
import chunliThumbnail from '../assets/characters/chunliThumbnail.png';
import lukeThumbnail from '../assets/characters/lukeThumbnail.png';
import cammyThumbnail from '../assets/characters/cammyThumbnail.png';
import maiThumbnail from '../assets/characters/maiThumbnail.png';
import ryuThumbnail from '../assets/characters/ryuThumbnail.png';

const CharacterCard = ({ character, onClick, compact = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Compact version for 2-column mobile
  if (compact) {
    return (
      <div
        className="relative group cursor-pointer"
        onClick={() => onClick?.(character)}
      >
        <div className="relative overflow-hidden rounded-xl shadow-lg active:scale-95 transition-transform">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${character.gradient} opacity-90`}></div>
          
          {/* Character Image */}
          <div className="relative h-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10"></div>
            
            {character.image ? (
              <img 
                src={character.image} 
                alt={character.name}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-white/20 text-4xl font-bold select-none">{character.name[0]}</div>
              </div>
            )}
            
            {/* Name overlay at bottom */}
            <div className="absolute bottom-2 left-2 right-2 z-20">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold text-sm">{character.name}</span>
                <span className="text-lg">{character.flag}</span>
              </div>
            </div>
          </div>
          
          {/* Compact info section */}
          <div className="relative bg-gray-900/95 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-gradient-to-br ${character.gradient}`}>
                {character.archetype}
              </span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < character.difficultyLevel ? '' : 'opacity-20'
                    }`}
                    style={{ backgroundColor: i < character.difficultyLevel ? character.accentColor : '#4B5563' }}
                  ></div>
                ))}
              </div>
            </div>
            
            <button
              className="w-full py-2 rounded-lg font-semibold text-white text-sm flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${character.accentColor}, ${character.accentColorDark})` }}
            >
              View Moves
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Full version (original)
  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(character)}
    >
      <div className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
        isHovered ? 'shadow-2xl scale-105' : 'shadow-xl'
      }`}>
        
        <div className={`absolute inset-0 bg-gradient-to-br ${character.gradient} opacity-90`}></div>
        
        <div 
          className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} 
          style={{
            background: `linear-gradient(45deg, ${character.accentColor}, transparent, ${character.accentColor})`,
            backgroundSize: '200% 200%',
            animation: isHovered ? 'borderGlow 2s ease infinite' : 'none',
            padding: '3px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude'
          }}
        ></div>
        
        <div className="relative h-80 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
          
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <span className="text-white font-bold text-lg tracking-wider">{character.name}</span>
            </div>
          </div>
          
          <div className="absolute top-4 right-4 z-20">
            <div className={`bg-gradient-to-br ${character.gradient} px-3 py-1 rounded-full border-2 border-white/40 shadow-lg`}>
              <span className="text-white text-xs font-semibold uppercase tracking-wide">{character.archetype}</span>
            </div>
          </div>
          
          {/* Character Image */}
          {character.image ? (
            <img 
              src={character.image} 
              alt={character.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-white/20 text-8xl font-bold select-none">{character.name[0]}</div>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 z-20">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-md shadow-lg">
              <span className="text-2xl" role="img" aria-label={`${character.name} nationality`}>
                {character.flag}
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative bg-gray-900/95 backdrop-blur-sm p-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Sword className="w-4 h-4 text-red-400 mr-1" />
                <span className="text-xs text-gray-400 uppercase">Power</span>
              </div>
              <div className="text-2xl font-bold text-white">{character.stats.power}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Zap className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-xs text-gray-400 uppercase">Speed</span>
              </div>
              <div className="text-2xl font-bold text-white">{character.stats.speed}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Shield className="w-4 h-4 text-blue-400 mr-1" />
                <span className="text-xs text-gray-400 uppercase">Defense</span>
              </div>
              <div className="text-2xl font-bold text-white">{character.stats.defense}</div>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400 uppercase">Difficulty</span>
              <span className="text-xs font-semibold" style={{ color: character.accentColor }}>
                {character.difficulty}
              </span>
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i < character.difficultyLevel 
                      ? 'opacity-100' 
                      : 'opacity-20'
                  }`}
                  style={{ 
                    backgroundColor: i < character.difficultyLevel ? character.accentColor : '#4B5563'
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-xs text-gray-400 uppercase mb-2">Fighting Style</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{character.fightingStyle}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-xs text-gray-400 uppercase mb-2 flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Signature Moves
            </h4>
            <div className="flex flex-wrap gap-2">
              {character.signatureMoves.slice(0, 3).map((move, idx) => (
                <div 
                  key={idx}
                  className="bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10"
                >
                  <span className="text-xs text-gray-300">{move}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center ${
              isHovered ? 'translate-y-0' : 'translate-y-1'
            }`}
            style={{ 
              background: `linear-gradient(135deg, ${character.accentColor}, ${character.accentColorDark})` 
            }}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(character);
            }}
          >
            <span>View Moves</span>
            <ChevronRight className={`w-5 h-5 ml-2 transition-transform duration-300 ${
              isHovered ? 'translate-x-1' : ''
            }`} />
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes borderGlow {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
};

const CharacterCards = ({ onCharacterSelect, selectedCharacterId }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [mobileColumns, setMobileColumns] = useState(() => {
    // Default to compact (2) on mobile, full (1) on larger screens
    return window.innerWidth < 768 ? 2 : 1;
  });
  
  const defaultCharacters = [
    {
      id: "ken",
      name: "Ken",
      flag: "🇺🇸",
      archetype: "Rushdown",
      image: kenThumbnail,
      gradient: "from-red-600 to-orange-500",
      accentColor: "#EF4444",
      accentColorDark: "#DC2626",
      stats: {
        power: 8,
        speed: 9,
        defense: 6
      },
      difficulty: "Intermediate",
      difficultyLevel: 3,
      fightingStyle: "Aggressive rushdown with devastating combos and pressure. Excels at close range with powerful Shoryukens.",
      signatureMoves: ["Hadoken", "Shoryuken", "Tatsumaki", "Jinrai Kick", "Dragonlash Kick"],
      description: "The eternal rival returns with explosive offensive capabilities."
    },
    {
      id: "terry",
      name: "Terry",
      flag: "🇺🇸",
      archetype: "All-Rounder",
      image: terryThumbnail,
      gradient: "from-blue-600 to-cyan-500",
      accentColor: "#3B82F6",
      accentColorDark: "#2563EB",
      stats: {
        power: 8,
        speed: 7,
        defense: 8
      },
      difficulty: "Beginner",
      difficultyLevel: 2,
      fightingStyle: "Versatile fighter with strong fundamentals. Mix of zoning and rushdown with powerful command grabs.",
      signatureMoves: ["Power Wave", "Burn Knuckle", "Crack Shoot", "Rising Tackle", "Power Dunk"],
      description: "The Legendary Wolf brings his iconic moves to Street Fighter 6."
    },
    {
      id: "chunli",
      name: "Chun-Li",
      flag: "🇨🇳",
      archetype: "Footsies",
      image: chunliThumbnail,
      gradient: "from-blue-400 to-purple-600",
      accentColor: "#60A5FA",
      accentColorDark: "#7C3AED",
      stats: {
        power: 7,
        speed: 8,
        defense: 7
      },
      difficulty: "Intermediate",
      difficultyLevel: 3,
      fightingStyle: "Exceptional footsies with versatile Serenity Stream stance. Dominates neutral with long-range pokes and lightning fast kicks.",
      signatureMoves: ["Kikoken", "Hundred Lightning Kicks", "Spinning Bird Kick", "Hazanshu", "Tensho Kicks"],
      description: "The legendary Interpol officer with the strongest legs in the world."
    },
    {
      id: "luke",
      name: "Luke",
      flag: "🇺🇸",
      archetype: "Rushdown",
      image: lukeThumbnail,
      gradient: "from-blue-500 to-indigo-600",
      accentColor: "#6366F1",
      accentColorDark: "#4F46E5",
      stats: {
        power: 8,
        speed: 8,
        defense: 7
      },
      difficulty: "Beginner",
      difficultyLevel: 2,
      fightingStyle: "Modern rushdown with easy-to-use tools. Strong Sand Blaster projectiles and Flash Knuckle pressure.",
      signatureMoves: ["Sand Blaster", "Flash Knuckle", "Avenger", "Rising Uppercut", "Slam Dunk"],
      description: "The face of Street Fighter 6's new generation."
    },
    {
      id: "cammy",
      name: "Cammy",
      flag: "🇬🇧",
      archetype: "Rushdown",
      image: cammyThumbnail,
      gradient: "from-green-500 to-teal-600",
      accentColor: "#14B8A6",
      accentColorDark: "#0D9488",
      stats: {
        power: 7,
        speed: 10,
        defense: 5
      },
      difficulty: "Intermediate",
      difficultyLevel: 3,
      fightingStyle: "Lightning-fast offense with devastating dive kicks. Excels at pressure and strike/throw mixups.",
      signatureMoves: ["Spiral Arrow", "Cannon Spike", "Cannon Strike", "Hooligan Combination", "Quick Spin Knuckle"],
      description: "Delta Red's elite operative with killer instinct."
    },
    {
      id: "mai",
      name: "Mai",
      flag: "🇯🇵",
      archetype: "Rushdown",
      image: maiThumbnail,
      gradient: "from-red-500 to-pink-600",
      accentColor: "#EC4899",
      accentColorDark: "#DB2777",
      stats: {
        power: 7,
        speed: 9,
        defense: 6
      },
      difficulty: "Advanced",
      difficultyLevel: 4,
      fightingStyle: "Agile ninja with Boosted special moves. Kachousen fans and Musasabi dive attacks create tricky offense.",
      signatureMoves: ["Kachousen", "Hishou Ryuuenjin", "Ryuuenbu", "Hissatsu Shinobi Bachi", "Musasabi no Mai"],
      description: "The fiery kunoichi from Fatal Fury joins the fight."
    },
    {
      id: "ryu",
      name: "Ryu",
      flag: "🇯🇵",
      archetype: "Shoto",
      image: ryuThumbnail,
      gradient: "from-gray-600 to-slate-700",
      accentColor: "#64748B",
      accentColorDark: "#475569",
      stats: {
        power: 8,
        speed: 7,
        defense: 8
      },
      difficulty: "Beginner",
      difficultyLevel: 2,
      fightingStyle: "The quintessential shoto with Denjin Charge enhancements. Balanced toolkit for any situation.",
      signatureMoves: ["Hadoken", "Shoryuken", "Tatsumaki", "Hashogeki", "Denjin Charge"],
      description: "The wandering warrior seeking the true meaning of strength."
    }
  ];

  // Sort characters alphabetically by name
  const characters = [...defaultCharacters].sort((a, b) => a.name.localeCompare(b.name));

  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-start justify-between">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Street Fighter 6
            <span className="block text-xl md:text-2xl text-gray-400 mt-2 font-normal">
              Browse Characters
            </span>
          </h1>
          
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
      </div>
      
      {/* Character Grid */}
      <div className="max-w-7xl mx-auto">
        <div className={`grid gap-4 md:gap-8 ${
          mobileColumns === 2 
            ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onClick={handleCharacterClick}
              compact={mobileColumns === 2}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterCards;
