import React, { useState, useRef } from 'react';
import { RotateCcw, Zap, Shield, AlertTriangle, CheckCircle, Play } from 'lucide-react';

const MoveCard = ({ move, showCharacter = false, characterName = '', compact = false }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hitType, setHitType] = useState('normal'); // 'normal', 'counter', 'punishCounter'
  const videoRef = useRef(null);

  if (!move) return null;

  const { yourPerspective, opponentPerspective, frameData, properties } = move;
  
  // Base frame advantage values
  const baseOnBlock = opponentPerspective?.frameAdvantage?.onBlock;
  const baseOnHit = opponentPerspective?.frameAdvantage?.onHit;
  
  // Calculate frame advantage based on hit type
  // Counter Hit: +2 frames, Punish Counter: +4 frames
  const getAdjustedFrames = (baseFrames, type) => {
    if (baseFrames === null || baseFrames === undefined) return null;
    switch (type) {
      case 'counter': return baseFrames + 2;
      case 'punishCounter': return baseFrames + 4;
      default: return baseFrames;
    }
  };
  
  // Calculate damage based on hit type
  // Counter Hit: 1.2x, Punish Counter: 1.2x (same multiplier, different hitstun)
  const getAdjustedDamage = (baseDamage, type) => {
    if (!baseDamage) return baseDamage;
    switch (type) {
      case 'counter': return Math.floor(baseDamage * 1.2);
      case 'punishCounter': return Math.floor(baseDamage * 1.2);
      default: return baseDamage;
    }
  };
  
  const onHit = getAdjustedFrames(baseOnHit, hitType);
  const onBlock = baseOnBlock; // Block frames don't change
  const damage = getAdjustedDamage(move.damage, hitType);
  
  // Cycle through hit types
  const cycleHitType = (e) => {
    e.stopPropagation();
    setHitType(prev => {
      switch (prev) {
        case 'normal': return 'counter';
        case 'counter': return 'punishCounter';
        case 'punishCounter': return 'normal';
        default: return 'normal';
      }
    });
  };
  
  // Get hit type display info
  const getHitTypeInfo = () => {
    switch (hitType) {
      case 'counter': 
        return { label: 'CH', fullLabel: 'Counter Hit', color: 'bg-yellow-500 text-black' };
      case 'punishCounter': 
        return { label: 'PC', fullLabel: 'Punish Counter', color: 'bg-red-500 text-white' };
      default: 
        return { label: 'N', fullLabel: 'Normal', color: 'bg-gray-600 text-white' };
    }
  };
  
  const hitTypeInfo = getHitTypeInfo();

  // Determine media type from file extension
  const getMediaType = (src) => {
    if (!src) return null;
    const ext = src.split('.').pop()?.toLowerCase();
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
    if (['gif'].includes(ext)) return 'gif';
    if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext)) return 'image';
    return null;
  };

  const mediaSrc = move.video || move.image || move.media;
  const mediaType = getMediaType(mediaSrc);

  // Determine risk level color
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'safe': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'unsafe': return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 'very_unsafe': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  // Format frame advantage with color
  const getFrameColor = (frames) => {
    if (frames === null || frames === undefined) return 'text-gray-400';
    if (frames > 0) return 'text-green-400';
    if (frames < -6) return 'text-red-400';
    if (frames < 0) return 'text-yellow-400';
    return 'text-gray-300';
  };

  const formatFrames = (frames) => {
    if (frames === null || frames === undefined) return '--';
    return frames > 0 ? `+${frames}` : frames.toString();
  };

  // Handle hover play for videos (desktop)
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && mediaType === 'video') {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current && mediaType === 'video') {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Handle click/tap for mobile - plays immediately on first tap
  const handleMediaClick = (e) => {
    e.stopPropagation();
    if (videoRef.current && mediaType === 'video') {
      setIsHovering(true); // Hide play button overlay
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        setIsHovering(false); // Show play button when paused
      }
    }
  };

  // Render media based on type
  const renderMedia = () => {
    if (!mediaSrc) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/50 to-purple-950/50">
          <span className="text-purple-300/50 text-sm">Move Preview</span>
        </div>
      );
    }

    switch (mediaType) {
      case 'video':
        return (
          <>
            <video
              ref={videoRef}
              src={mediaSrc}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              preload="metadata"
            />
            {!isHovering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-purple-600/80 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
              </div>
            )}
          </>
        );
      
      case 'gif':
      case 'image':
        return (
          <img
            src={mediaSrc}
            alt={move.displayName}
            className="w-full h-full object-cover"
          />
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/50 to-purple-950/50">
            <span className="text-purple-300/50 text-sm">Move Preview</span>
          </div>
        );
    }
  };

  // Frame Data Badge Component - Color coded like Figma
  const FrameBadge = ({ label, value, color }) => (
    <div className={`flex flex-col items-center ${compact ? 'min-w-[28px]' : 'min-w-[40px]'}`}>
      <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} text-purple-300/70 uppercase tracking-wide`}>{label}</span>
      <span 
        className={`${compact ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5'} font-bold font-mono rounded ${color}`}
      >
        {value || '--'}
      </span>
    </div>
  );

  // Frame Advantage Badge with emoji-style icons
  const FrameAdvantageBadge = ({ type, value, hitTypeLabel }) => {
    const isOnHit = type === 'hit';
    const icon = isOnHit ? '👊' : '🛡️';
    const bgColor = value > 0 ? 'bg-green-500/20 border-green-500/50' : 
                    value < -6 ? 'bg-red-500/20 border-red-500/50' : 
                    value < 0 ? 'bg-yellow-500/20 border-yellow-500/50' : 
                    'bg-gray-500/20 border-gray-500/50';
    
    return (
      <div className={`flex items-center gap-1 ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'} rounded border ${bgColor}`}>
        <span className={compact ? 'text-xs' : 'text-sm'}>{icon}</span>
        <span className={`font-bold font-mono ${getFrameColor(value)} ${compact ? 'text-xs' : 'text-sm'}`}>
          {formatFrames(value)}
        </span>
        {hitTypeLabel && hitType !== 'normal' && (
          <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} text-yellow-400`}>({hitTypeLabel})</span>
        )}
      </div>
    );
  };

  return (
    <div className="flip-card w-full">
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        {/* Front - Your Perspective */}
        <div className={`flip-card-front ${isFlipped ? 'invisible' : ''}`}>
          {/* Gradient Border Wrapper */}
          <div className="p-[3px] rounded-2xl bg-gradient-to-b from-purple-500/60 via-purple-600/40 to-purple-900/60 h-full">
            {/* Main Card with Purple Gradient Background */}
            <div 
              className="rounded-xl overflow-hidden h-full flex flex-col"
              style={{
                background: 'linear-gradient(180deg, #200147 0%, #2e0549 50%, #1a0338 100%)'
              }}
            >
              {/* 16:9 Media Preview */}
              <div 
                className="aspect-video relative overflow-hidden cursor-pointer border-b border-purple-500/30"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleMediaClick}
              >
                {renderMedia()}
              </div>

              <div className={`${compact ? 'p-2' : 'p-4'} flex flex-col flex-1`}>
                {/* Header with Hit Type Toggle */}
                <div className="flex justify-between items-start mb-2">
                  <div className="min-w-0 flex-1">
                    {showCharacter && characterName && (
                      <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-purple-300 font-medium uppercase tracking-wide`}>{characterName}</span>
                    )}
                    <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-white truncate`}>{move.displayName}</h3>
                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-purple-300/80 font-mono`}>{move.input}</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      {/* Hit Type Toggle Button */}
                      <button
                        onClick={cycleHitType}
                        className={`${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} font-bold rounded ${hitTypeInfo.color} hover:opacity-80 transition-opacity`}
                        title={`${hitTypeInfo.fullLabel} - Click to cycle`}
                      >
                        {hitTypeInfo.label}
                      </button>
                    </div>
                    <span className={`${compact ? 'text-lg' : 'text-2xl'} font-bold ${hitType !== 'normal' ? 'text-yellow-400' : 'text-white'}`}>
                      {damage}
                    </span>
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-purple-300/60 block`}>DMG</span>
                  </div>
                </div>

                {/* Color-Coded Frame Data Badges */}
                {compact ? (
                  <div className="flex items-center justify-between gap-1 mb-2">
                    {/* Frame Data - Compact */}
                    <div className="flex gap-1">
                      <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-teal-500 text-white">{frameData?.startup || '--'}</span>
                      <span className="text-xs font-bold font-mono px-1.5 py-0.5 rounded bg-pink-500 text-white">{frameData?.active || '--'}</span>
                    </div>
                    {/* Frame Advantage - Compact */}
                    <div className="flex gap-1">
                      <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${onBlock >= 0 ? 'bg-green-500/20 text-green-400' : onBlock < -6 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {formatFrames(onBlock)}
                      </span>
                      <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${onHit >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {formatFrames(onHit)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Frame Data Row - Full Size with Color Badges */}
                    <div className="flex items-center justify-between mb-3 bg-black/20 rounded-lg p-2">
                      <div className="flex gap-2">
                        <FrameBadge label="Startup" value={frameData?.startup} color="bg-teal-500 text-white" />
                        <FrameBadge label="Active" value={frameData?.active} color="bg-pink-500 text-white" />
                        <FrameBadge label="Recovery" value={frameData?.recovery} color="bg-blue-500 text-white" />
                        <FrameBadge label="Total" value={frameData?.total} color="bg-gray-800 text-white border border-gray-600" />
                      </div>
                    </div>

                    {/* Frame Advantage Row */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 flex items-center justify-center gap-2 bg-black/20 rounded-lg p-2">
                        <FrameAdvantageBadge type="block" value={onBlock} />
                        <span className="text-[10px] text-purple-300/50 uppercase">Block</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2 bg-black/20 rounded-lg p-2">
                        <FrameAdvantageBadge type="hit" value={onHit} hitTypeLabel={hitTypeInfo.label} />
                        <span className="text-[10px] text-purple-300/50 uppercase">Hit</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Properties Tags - Hide in compact mode */}
                {!compact && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {properties?.hitLevel && (
                      <span className="px-2 py-1 text-xs rounded bg-purple-900/50 text-purple-200 border border-purple-500/30 capitalize">
                        {properties.hitLevel}
                      </span>
                    )}
                    {properties?.cancelable && (
                      <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 border border-green-500/30 font-bold">
                        C
                      </span>
                    )}
                    {properties?.projectile && (
                      <span className="px-2 py-1 text-xs rounded bg-purple-400/20 text-purple-300 border border-purple-400/30">
                        Projectile
                      </span>
                    )}
                    {properties?.invincible && (
                      <span className="px-2 py-1 text-xs rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                        Invincible
                      </span>
                    )}
                  </div>
                )}

                {/* Tactical Use - Hide in compact mode */}
                {!compact && yourPerspective?.tacticalUse && (
                  <p className="text-sm text-purple-200/70 mb-3">{yourPerspective.tacticalUse}</p>
                )}

                {/* Spacer to push button to bottom */}
                <div className="flex-1" />

                {/* Flip Button - anchored to bottom */}
                <button
                  onClick={() => setIsFlipped(true)}
                  className={`w-full ${compact ? 'py-1.5 text-sm' : 'py-2'} bg-purple-700/50 hover:bg-purple-600/50 text-purple-100 rounded-lg transition-colors flex items-center justify-center gap-2 border border-purple-500/30`}
                >
                  <RotateCcw className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {compact ? 'Flip' : 'Flip to Opponent View'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back - Opponent Perspective */}
        <div className={`flip-card-back ${!isFlipped ? 'invisible' : ''}`}>
          {/* Gradient Border Wrapper */}
          <div className="p-[3px] rounded-2xl bg-gradient-to-b from-purple-500/60 via-purple-600/40 to-purple-900/60 h-full">
            <div 
              className="rounded-xl overflow-hidden h-full flex flex-col"
              style={{
                background: 'linear-gradient(180deg, #200147 0%, #2e0549 50%, #1a0338 100%)'
              }}
            >
              {/* Risk Banner */}
              <div className={`${compact ? 'p-2' : 'p-4'} ${
                opponentPerspective?.riskLevel === 'very_unsafe' ? 'bg-red-500/30' :
                opponentPerspective?.riskLevel === 'unsafe' ? 'bg-orange-500/30' :
                opponentPerspective?.riskLevel === 'medium' ? 'bg-yellow-500/30' :
                'bg-green-500/30'
              } border-b border-purple-500/30`}>
                <div className="flex items-center gap-2">
                  {opponentPerspective?.riskLevel === 'very_unsafe' || opponentPerspective?.riskLevel === 'unsafe' ? (
                    <AlertTriangle className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-red-400`} />
                  ) : (
                    <CheckCircle className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-green-400`} />
                  )}
                  <div>
                    <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-white truncate`}>{move.displayName}</h3>
                    <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold font-mono ${getFrameColor(onBlock)}`}>
                      {formatFrames(onBlock)} on block
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${compact ? 'p-2' : 'p-4'} flex flex-col flex-1`}>
                {/* Risk Assessment - Simplified in compact */}
                <div className={`mb-3 ${compact ? 'p-2' : 'p-3'} rounded-lg border ${getRiskColor(opponentPerspective?.riskLevel)} bg-black/20`}>
                  <h4 className={`${compact ? 'text-xs' : 'text-base'} font-semibold capitalize`}>
                    {opponentPerspective?.riskLevel?.replace('_', ' ') || 'Unknown'}
                  </h4>
                  {!compact && (
                    <p className="text-sm opacity-80">{opponentPerspective?.riskDescription}</p>
                  )}
                </div>

                {/* What Opponent Can Do - Hide in compact */}
                {!compact && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-purple-300/70 mb-2 uppercase tracking-wide">Opponent Options:</h4>
                    <div className="space-y-2">
                      {onBlock !== null && onBlock < 0 && Math.abs(onBlock) >= 4 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          <span className="text-purple-100/80">
                            Can punish with {Math.abs(onBlock)}f or faster moves
                          </span>
                        </div>
                      )}
                      {onBlock !== null && onBlock >= 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-green-400" />
                          <span className="text-purple-100/80">
                            You're {onBlock > 0 ? 'plus' : 'even'} - continue pressure
                          </span>
                        </div>
                      )}
                      {onBlock !== null && onBlock < 0 && Math.abs(onBlock) < 4 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-blue-400" />
                          <span className="text-purple-100/80">
                            Minus but safe - respect opponent's turn
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Frame Data Summary - Simplified in compact */}
                {compact ? (
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1 bg-black/30 rounded p-1 text-center">
                      <p className="text-xs font-mono text-white">{frameData?.startup || '--'}f</p>
                    </div>
                    <div className="flex-1 bg-black/30 rounded p-1 text-center">
                      <p className="text-xs font-mono text-white">
                        {onBlock !== null && onBlock < -3 ? `≤${Math.abs(onBlock)}f` : 'Safe'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <span className="text-xs text-purple-300/60">Startup</span>
                      <p className="text-lg font-bold font-mono text-white">{frameData?.startup || '--'}f</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <span className="text-xs text-purple-300/60">Punishable By</span>
                      <p className="text-lg font-bold font-mono text-white">
                        {onBlock !== null && onBlock < -3 ? `≤${Math.abs(onBlock)}f` : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Links Section - NOW ON BACK SIDE */}
                {!compact && (move.linksOnNormal?.length > 0 || move.linksOnCounter?.length > 0 || move.linksOnPunishCounter?.length > 0) && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-purple-300/70 mb-2 uppercase tracking-wide">Links Into:</h4>
                    <div className="flex flex-wrap gap-1">
                      {(hitType === 'normal' ? move.linksOnNormal : 
                        hitType === 'counter' ? move.linksOnCounter : 
                        move.linksOnPunishCounter)?.slice(0, 4).map((link, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-purple-500/20 text-purple-200 rounded border border-purple-500/30">
                          {link}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spacer to push button to bottom */}
                <div className="flex-1" />

                {/* Flip Back Button - anchored to bottom */}
                <button
                  onClick={() => setIsFlipped(false)}
                  className={`w-full ${compact ? 'py-1.5 text-sm' : 'py-2'} bg-purple-700/50 hover:bg-purple-600/50 text-purple-100 rounded-lg transition-colors flex items-center justify-center gap-2 border border-purple-500/30`}
                >
                  <RotateCcw className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {compact ? 'Flip' : 'Flip to Your View'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveCard;
