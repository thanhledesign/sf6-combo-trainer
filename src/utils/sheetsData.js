/**
 * Google Sheets CMS Integration
 * 
 * Fetches frame data from a published Google Sheet.
 * Sheet must be published: File → Share → Publish to web → CSV
 * 
 * Sheet ID: 1Z1InqW1dISE5kgDJWM47PF_gznjt7zJhw4_3LyriSpE
 */

const SHEET_ID = '1Z1InqW1dISE5kgDJWM47PF_gznjt7zJhw4_3LyriSpE';

// Character tab GIDs from your published sheet
const CHARACTER_GIDS = {
  ken: '1393077364',
  terry: '1324592755',
  chunli: '1692349138',
  luke: '2046753818',
  cammy: '2032274159',
  mai: '1705290896',
  ryu: '1135562225',
};

// Cache for fetched data
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    result.push(values);
  }
  
  return result;
}

/**
 * Determine move category from section headers in sheet
 */
function determineCategory(moveName, currentSection) {
  if (currentSection.includes('Normal')) return 'normal';
  if (currentSection.includes('Unique')) return 'unique';
  if (currentSection.includes('Special')) return 'special';
  if (currentSection.includes('Super')) return 'super';
  if (currentSection.includes('Throw')) return 'throw';
  if (currentSection.includes('Common')) return 'common';
  return 'normal';
}

/**
 * Generate a move ID from the move name
 */
function generateMoveId(characterId, moveName) {
  const cleanName = moveName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  return `${characterId}_${cleanName}`;
}

/**
 * Parse frame data string like "4-6" into startup/active/recovery
 */
function parseFrameRange(frameStr) {
  if (!frameStr || frameStr === '-') return null;
  
  // Handle "X-Y" format (active frames)
  const rangeMatch = frameStr.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    return {
      start: parseInt(rangeMatch[1]),
      end: parseInt(rangeMatch[2])
    };
  }
  
  // Handle single number
  const num = parseInt(frameStr);
  return isNaN(num) ? null : num;
}

/**
 * Parse the startup column which may have the format "X" or include range
 */
function parseStartup(startupStr) {
  if (!startupStr) return null;
  
  // Handle "X total frames" format
  const totalMatch = startupStr.match(/(\d+)\s*total/i);
  if (totalMatch) {
    return { total: parseInt(totalMatch[1]) };
  }
  
  const num = parseInt(startupStr);
  return isNaN(num) ? null : num;
}

/**
 * Parse frame advantage value (handles "D" for knockdown, numbers, etc.)
 */
function parseFrameAdvantage(value) {
  if (!value || value === '-') return null;
  if (value === 'D') return 'knockdown';
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

/**
 * Determine risk level based on frame advantage on block
 */
function determineRiskLevel(onBlock) {
  if (onBlock === null || onBlock === 'knockdown') return 'unsafe';
  if (typeof onBlock === 'number') {
    if (onBlock >= 0) return 'safe';
    if (onBlock >= -6) return 'safe';
    if (onBlock >= -10) return 'medium';
    return 'unsafe';
  }
  return 'medium';
}

/**
 * Parse properties column into structured data
 */
function parseProperties(propStr) {
  if (!propStr) return { hitLevel: 'high' };
  
  const props = { hitLevel: 'high' };
  const lowerProps = propStr.toLowerCase();
  
  if (lowerProps.includes('low')) props.hitLevel = 'low';
  else if (lowerProps.includes('mid')) props.hitLevel = 'mid';
  else if (lowerProps.includes('throw')) props.hitLevel = 'throw';
  else if (lowerProps.includes('projectile')) props.projectile = true;
  
  return props;
}

/**
 * Transform a row of sheet data into our move format
 */
function transformRowToMove(row, characterId, currentSection) {
  const [
    moveName,      // A
    startup,       // B
    active,        // C
    recovery,      // D
    onHit,         // E
    onBlock,       // F
    cancel,        // G
    damage,        // H
    comboScaling,  // I
    driveHit,      // J
    driveBlock,    // K
    drivePC,       // L
    superGauge,    // M
    properties,    // N
    misc           // O
  ] = row;

  if (!moveName || moveName.includes('Move Name')) return null;
  
  // Skip section headers
  if (moveName.match(/^(Normal|Unique|Special|Super|Throw|Common)\s*Moves?\s*\(\d+\)/i)) {
    return { isSection: true, sectionName: moveName };
  }

  const moveId = generateMoveId(characterId, moveName);
  const category = determineCategory(moveName, currentSection);
  const startupData = parseStartup(startup);
  const activeData = parseFrameRange(active);
  const onBlockParsed = parseFrameAdvantage(onBlock);
  const onHitParsed = parseFrameAdvantage(onHit);
  const riskLevel = determineRiskLevel(onBlockParsed);

  // Extract input notation from move name if present
  const inputMatch = moveName.match(/\(([^)]+)\)/);
  const input = inputMatch ? inputMatch[1] : '';
  
  // Clean move name
  const displayName = moveName
    .replace(/\([^)]*\)/g, '')
    .replace(/[LMH]$/, '')
    .trim();

  return {
    id: moveId,
    displayName: displayName,
    shortName: displayName.substring(0, 15),
    notation: moveName,
    input: input,
    category: category,
    damage: parseInt(damage) || 0,
    
    yourPerspective: {
      tacticalUse: misc || '',
      whenToUse: '',
      situations: [category === 'normal' ? 'neutral' : category],
      range: 'mid',
      connectsTo: [],
      executionDifficulty: 'easy'
    },
    
    opponentPerspective: {
      frameAdvantage: {
        onBlock: typeof onBlockParsed === 'number' ? onBlockParsed : null,
        onHit: typeof onHitParsed === 'number' ? onHitParsed : null
      },
      riskLevel: riskLevel,
      riskDescription: misc || ''
    },
    
    frameData: {
      startup: typeof startupData === 'number' ? startupData : 
               (startupData?.total ? startupData.total : null),
      active: activeData ? `${activeData.start}-${activeData.end}` : null,
      recovery: parseInt(recovery) || null,
      total: startupData?.total || null
    },
    
    properties: {
      ...parseProperties(properties),
      cancelable: cancel?.toLowerCase().includes('cancel') || false
    },
    
    // Additional data from sheet
    comboScaling: comboScaling || null,
    driveGauge: {
      onHit: parseInt(driveHit) || 0,
      onBlock: parseInt(driveBlock) || 0,
      onPunishCounter: parseInt(drivePC) || 0
    },
    superArtGauge: parseInt(superGauge) || 0
  };
}

/**
 * Fetch and parse character data from Google Sheets
 */
export async function fetchCharacterFromSheet(characterId) {
  const gid = CHARACTER_GIDS[characterId];
  if (gid === null || gid === undefined) {
    console.warn(`No GID configured for character: ${characterId}`);
    return null;
  }

  // Check cache
  const cacheKey = `${characterId}_${gid}`;
  const cached = dataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    // Transform rows to moves
    const moves = {};
    const tactics = {
      neutral: { name: 'Neutral Tactics', moveIds: [], icon: '🎯' },
      offensive: { name: 'Offensive Pressure', moveIds: [], icon: '⚡' },
      combo: { name: 'Combo Tactics', moveIds: [], icon: '🔥' },
      corner: { name: 'Corner Tactics', moveIds: [], icon: '🛡️' }
    };
    
    let currentSection = 'Normal Moves';
    
    // Skip header rows (usually first 3-4 rows)
    for (let i = 3; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 2) continue;
      
      const result = transformRowToMove(row, characterId, currentSection);
      
      if (!result) continue;
      
      if (result.isSection) {
        currentSection = result.sectionName;
        continue;
      }
      
      moves[result.id] = result;
      
      // Add to appropriate tactic category
      if (result.category === 'normal' || result.category === 'unique') {
        tactics.neutral.moveIds.push(result.id);
      } else if (result.category === 'special') {
        tactics.offensive.moveIds.push(result.id);
      } else if (result.category === 'super') {
        tactics.combo.moveIds.push(result.id);
      }
    }
    
    const characterData = {
      character: {
        id: characterId,
        name: characterId.charAt(0).toUpperCase() + characterId.slice(1),
        displayName: characterId.charAt(0).toUpperCase() + characterId.slice(1),
        archetype: 'unknown',
        description: `Frame data from Google Sheets`,
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      tactics,
      moves
    };
    
    // Cache the result
    dataCache.set(cacheKey, {
      data: characterData,
      timestamp: Date.now()
    });
    
    return characterData;
    
  } catch (error) {
    console.error(`Error fetching character ${characterId}:`, error);
    return null;
  }
}

/**
 * Clear the data cache
 */
export function clearCache() {
  dataCache.clear();
}

/**
 * Check if Google Sheets is accessible
 */
export async function checkSheetsConnection() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get the sheet URL for manual access
 */
export function getSheetUrl() {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
}

export default {
  fetchCharacterFromSheet,
  clearCache,
  checkSheetsConnection,
  getSheetUrl,
  SHEET_ID,
  CHARACTER_GIDS
};
