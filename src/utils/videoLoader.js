/**
 * SF6 Combo Trainer - Video Loader Utility
 * 
 * Purpose: Optimize video loading for mobile devices.
 * Handles quality selection, connection awareness, and caching strategies.
 * 
 * Usage:
 *   import { getVideoUrl, preloadVideo, getVideoConfig } from '@/utils/videoLoader';
 *   
 *   // Get appropriate video URL
 *   const videoSrc = getVideoUrl('/videos/ken/shoryuken.mp4');
 *   
 *   // Preload a video
 *   preloadVideo('/videos/ken/hadoken.mp4');
 *   
 *   // Get config for video element
 *   const config = getVideoConfig();
 *   <video {...config} src={videoSrc} />
 * 
 * Video Naming Convention (when multiple qualities exist):
 *   /videos/ken/shoryuken.mp4      - Original/high quality
 *   /videos/ken/shoryuken-med.mp4  - Medium quality (720p)
 *   /videos/ken/shoryuken-low.mp4  - Low quality (480p)
 */

// ===========================================
// CONNECTION DETECTION
// ===========================================

/**
 * Get current connection info
 * @returns {object} Connection details
 */
export function getConnectionInfo() {
  const connection = navigator.connection || 
                     navigator.mozConnection || 
                     navigator.webkitConnection;
  
  if (!connection) {
    return {
      type: 'unknown',
      effectiveType: '4g', // Assume good connection if API unavailable
      saveData: false,
      downlink: null,
    };
  }
  
  return {
    type: connection.type || 'unknown',
    effectiveType: connection.effectiveType || '4g',
    saveData: connection.saveData || false,
    downlink: connection.downlink || null, // Mbps
  };
}

/**
 * Determine optimal video quality based on connection
 * @returns {'high' | 'medium' | 'low'}
 */
export function getOptimalQuality() {
  const { effectiveType, saveData, downlink } = getConnectionInfo();
  
  // User has data saver enabled
  if (saveData) return 'low';
  
  // Check effective connection type
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return 'low';
    case '3g':
      return 'medium';
    case '4g':
    default:
      // If we have downlink info, use it for more precision
      if (downlink !== null) {
        if (downlink < 1) return 'low';
        if (downlink < 5) return 'medium';
      }
      return 'high';
  }
}

// ===========================================
// VIDEO URL HANDLING
// ===========================================

/**
 * Get the appropriate video URL based on quality settings
 * 
 * @param {string} videoPath - Original video path
 * @param {'auto' | 'high' | 'medium' | 'low'} quality - Desired quality
 * @returns {string} - Adjusted video path
 */
export function getVideoUrl(videoPath, quality = 'auto') {
  if (!videoPath) return null;
  
  // Determine quality to use
  const targetQuality = quality === 'auto' ? getOptimalQuality() : quality;
  
  // For now, we only have one quality level
  // When multiple qualities exist, uncomment below:
  
  /*
  if (targetQuality === 'high') {
    return videoPath; // Original file
  }
  
  if (targetQuality === 'medium') {
    // Check if medium quality exists
    const medPath = videoPath.replace('.mp4', '-med.mp4');
    // In production, you'd check if file exists
    return medPath;
  }
  
  if (targetQuality === 'low') {
    const lowPath = videoPath.replace('.mp4', '-low.mp4');
    return lowPath;
  }
  */
  
  // Currently just return the original path
  return videoPath;
}

/**
 * Get video poster URL (first frame thumbnail)
 * @param {string} videoPath - Video path
 * @returns {string | null} - Poster image path
 */
export function getVideoPoster(videoPath) {
  if (!videoPath) return null;
  
  // Convention: poster is same name with .jpg extension
  // Example: /videos/ken/shoryuken.mp4 -> /videos/ken/shoryuken.jpg
  return videoPath.replace('.mp4', '.jpg').replace('.webm', '.jpg');
}

// ===========================================
// PRELOADING
// ===========================================

// Track preloaded videos to avoid duplicate requests
const preloadedVideos = new Set();

/**
 * Preload a video for smoother playback
 * @param {string} videoPath - Video to preload
 * @returns {Promise<void>}
 */
export function preloadVideo(videoPath) {
  return new Promise((resolve, reject) => {
    if (!videoPath || preloadedVideos.has(videoPath)) {
      resolve();
      return;
    }
    
    const video = document.createElement('video');
    video.preload = 'auto';
    
    video.onloadeddata = () => {
      preloadedVideos.add(videoPath);
      resolve();
    };
    
    video.onerror = () => {
      reject(new Error(`Failed to preload: ${videoPath}`));
    };
    
    video.src = getVideoUrl(videoPath);
  });
}

/**
 * Preload multiple videos
 * @param {string[]} videoPaths - Array of video paths
 * @returns {Promise<void[]>}
 */
export function preloadVideos(videoPaths) {
  return Promise.all(
    videoPaths.map(path => preloadVideo(path).catch(() => null))
  );
}

// ===========================================
// VIDEO ELEMENT CONFIG
// ===========================================

/**
 * Get optimized config for video elements
 * @param {object} options - Configuration options
 * @returns {object} - Props to spread on video element
 */
export function getVideoConfig(options = {}) {
  const {
    autoplay = false,
    loop = true,
    muted = true,
    playsInline = true, // Critical for iOS
    preload = 'metadata',
  } = options;
  
  return {
    autoPlay: autoplay,
    loop,
    muted,
    playsInline, // Required for iOS inline playback
    preload,
    // Prevent fullscreen on iOS
    'webkit-playsinline': 'true',
    'x-webkit-airplay': 'allow',
  };
}

// ===========================================
// MOBILE-SPECIFIC HELPERS
// ===========================================

/**
 * Check if device is likely on mobile data
 * @returns {boolean}
 */
export function isOnMobileData() {
  const { type, effectiveType } = getConnectionInfo();
  return type === 'cellular' || 
         effectiveType === '2g' || 
         effectiveType === '3g';
}

/**
 * Check if we should show video or static image
 * Based on connection and data saver settings
 * @returns {boolean}
 */
export function shouldShowVideo() {
  const { saveData } = getConnectionInfo();
  
  // If user has data saver on, prefer images
  if (saveData) return false;
  
  // Otherwise show video
  return true;
}

/**
 * Get media type to display
 * @param {string} videoPath - Video path if available
 * @param {string} imagePath - Fallback image path
 * @returns {{ type: 'video' | 'image', src: string }}
 */
export function getMediaToShow(videoPath, imagePath) {
  if (videoPath && shouldShowVideo()) {
    return {
      type: 'video',
      src: getVideoUrl(videoPath),
    };
  }
  
  return {
    type: 'image',
    src: imagePath || getVideoPoster(videoPath),
  };
}

// ===========================================
// USAGE EXAMPLE IN MOVECARD
// ===========================================
/*

import { 
  getVideoUrl, 
  getVideoConfig, 
  getMediaToShow 
} from '@/utils/videoLoader';

function MoveMedia({ move }) {
  const media = getMediaToShow(move.video, move.image);
  const videoConfig = getVideoConfig();
  
  if (media.type === 'video') {
    return (
      <video 
        {...videoConfig}
        src={media.src}
        poster={getVideoPoster(move.video)}
      />
    );
  }
  
  return <img src={media.src} alt={move.displayName} />;
}

*/

export default {
  getVideoUrl,
  getVideoPoster,
  getVideoConfig,
  preloadVideo,
  preloadVideos,
  getConnectionInfo,
  getOptimalQuality,
  isOnMobileData,
  shouldShowVideo,
  getMediaToShow,
};
