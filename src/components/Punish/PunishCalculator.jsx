import React, { useState, useMemo } from 'react';
import { Calculator, Zap, Shield, Target } from 'lucide-react';
import MoveCard from '../Card/MoveCard';

const PunishCalculator = ({ characterData }) => {
  const [frameDisadvantage, setFrameDisadvantage] = useState('');
  const [sortBy, setSortBy] = useState('damage');
  const [showAllOptions, setShowAllOptions] = useState(false);

  if (!characterData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <p className="text-gray-400 text-center">No character selected. Please select a character first.</p>
      </div>
    );
  }

  const { character, moves } = characterData;
  const allMoves = Object.values(moves || {});

  // Find punish options
  const punishOptions = useMemo(() => {
    const frameValue = parseInt(frameDisadvantage);
    if (isNaN(frameValue) || frameValue >= 0) return [];

    const punishableFrames = Math.abs(frameValue);

    return allMoves
      .filter(move => {
        const startup = move.frameData?.startup;
        return startup && startup <= punishableFrames;
      })
      .sort((a, b) => {
        if (sortBy === 'damage') {
          return (b.damage || 0) - (a.damage || 0);
        }
        return (a.frameData?.startup || 99) - (b.frameData?.startup || 99);
      });
  }, [allMoves, frameDisadvantage, sortBy]);

  // Categorize punishes
  const categorizedPunishes = useMemo(() => {
    if (punishOptions.length === 0) return null;

    const optimal = punishOptions[0]; // Highest damage
    const fastest = [...punishOptions].sort((a, b) => 
      (a.frameData?.startup || 99) - (b.frameData?.startup || 99)
    )[0];
    const safest = punishOptions.find(m => 
      m.opponentPerspective?.frameAdvantage?.onBlock >= -3
    );

    return { optimal, fastest, safest, all: punishOptions };
  }, [punishOptions]);

  // Quick preset buttons
  const presets = [
    { label: '-4', value: '-4', description: 'Light' },
    { label: '-6', value: '-6', description: 'Medium' },
    { label: '-8', value: '-8', description: 'Heavy' },
    { label: '-10', value: '-10', description: 'Full' },
    { label: '-15', value: '-15', description: 'Big' },
    { label: '-20+', value: '-25', description: 'Free' },
  ];

  const handleCalculate = () => {
    // Just triggers the useMemo recalculation
    if (frameDisadvantage) {
      setShowAllOptions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Punish Calculator</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Enter the opponent's frame disadvantage to see your punish options
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
          {/* Input and Calculate Button - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="number"
              value={frameDisadvantage}
              onChange={(e) => setFrameDisadvantage(e.target.value)}
              placeholder="-6"
              className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-xl font-mono text-center sm:text-left"
            />
            <button
              onClick={handleCalculate}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Calculate
            </button>
          </div>

          {/* Presets - Responsive grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {presets.map(preset => (
              <button
                key={preset.value}
                onClick={() => setFrameDisadvantage(preset.value)}
                className={`px-3 py-2 rounded-lg transition-colors text-center ${
                  frameDisadvantage === preset.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="font-mono font-bold block">{preset.label}</span>
                <span className="text-xs opacity-70 hidden sm:block">{preset.description}</span>
              </button>
            ))}
          </div>

          {/* How to use hint */}
          <p className="text-gray-500 text-xs mt-4">
            <strong>How to use:</strong> If opponent's move is "minus 6 on block," enter -6. The calculator shows which of your moves are fast enough to punish.
          </p>
        </div>

        {/* Results */}
        {categorizedPunishes && (
          <>
            {/* Quick Recommendations - Stack on mobile */}
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-6 md:mb-8">
              {/* Optimal Damage */}
              {categorizedPunishes.optimal && (
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-sm">Optimal Damage Punish</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{categorizedPunishes.optimal.displayName}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-300 font-mono text-sm">{categorizedPunishes.optimal.damage} damage • {categorizedPunishes.optimal.frameData?.startup}f startup</p>
                  </div>
                  <p className="text-gray-500 text-xs mt-2 line-clamp-2">
                    {categorizedPunishes.optimal.yourPerspective?.tacticalUse}
                  </p>
                </div>
              )}

              {/* Safest/Fastest */}
              {categorizedPunishes.safest && categorizedPunishes.safest.id !== categorizedPunishes.optimal?.id && (
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-semibold text-sm">Safest/Fastest Option</span>
                  </div>
                  <h3 className="text-white font-bold text-lg">{categorizedPunishes.safest.displayName}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-300 font-mono text-sm">
                      {categorizedPunishes.safest.damage} damage • {categorizedPunishes.safest.frameData?.startup}f startup
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Show All Options Toggle */}
            <button
              onClick={() => setShowAllOptions(!showAllOptions)}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2"
            >
              {showAllOptions ? '− Hide' : '+ Show'} all {categorizedPunishes.all.length} options
            </button>

            {/* All Options Grid - Collapsible */}
            {showAllOptions && (
              <>
                {/* Sort Toggle */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">
                    All Punish Options
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('damage')}
                      className={`px-3 py-1.5 rounded text-sm ${
                        sortBy === 'damage' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      Damage
                    </button>
                    <button
                      onClick={() => setSortBy('speed')}
                      className={`px-3 py-1.5 rounded text-sm ${
                        sortBy === 'speed' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      Speed
                    </button>
                  </div>
                </div>

                {/* Options Grid - 1 col mobile, 2 col tablet+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorizedPunishes.all.map(move => (
                    <MoveCard key={move.id} move={move} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Empty State */}
        {!categorizedPunishes && frameDisadvantage && parseInt(frameDisadvantage) < 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No punish options found for {frameDisadvantage} frames</p>
          </div>
        )}

        {/* Instruction State */}
        {!frameDisadvantage && (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <Calculator className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Enter a frame disadvantage to see punish options</p>
            <p className="text-gray-500 text-sm mt-2">
              Example: If opponent's move is -6 on block, enter -6
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PunishCalculator;
