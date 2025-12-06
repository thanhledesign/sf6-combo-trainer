/**
 * useCharacterData Hook
 * 
 * Provides character frame data with multiple data source support:
 * 1. Google Sheets (primary, for real-time updates)
 * 2. Static JSON files (fallback)
 * 
 * Usage:
 *   const { data, loading, error, refresh, source } = useCharacterData('ken');
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchCharacterFromSheet, CHARACTER_GIDS } from '../utils/sheetsData';

// Import static data as fallback
import kenData from '../data/characters/ken.json';
import terryData from '../data/characters/terry.json';
import chunliData from '../data/characters/chunli.json';
import lukeData from '../data/characters/luke.json';
import cammyData from '../data/characters/cammy.json';
import maiData from '../data/characters/mai.json';
import ryuData from '../data/characters/ryu.json';

const STATIC_DATA = {
  ken: kenData,
  terry: terryData,
  chunli: chunliData,
  luke: lukeData,
  cammy: cammyData,
  mai: maiData,
  ryu: ryuData
};

// Configuration
const USE_SHEETS_PRIMARY = true; // Set to false to use static data only
const SHEETS_TIMEOUT = 5000; // 5 seconds timeout for sheets fetch

/**
 * Hook to get character data with sheet/static fallback
 */
export function useCharacterData(characterId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('static'); // 'sheets' or 'static'

  const fetchData = useCallback(async () => {
    if (!characterId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Check if we have a GID configured for this character
    const hasSheetConfig = CHARACTER_GIDS[characterId] !== null && 
                          CHARACTER_GIDS[characterId] !== undefined;

    if (USE_SHEETS_PRIMARY && hasSheetConfig) {
      try {
        // Try to fetch from sheets with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), SHEETS_TIMEOUT)
        );
        
        const sheetData = await Promise.race([
          fetchCharacterFromSheet(characterId),
          timeoutPromise
        ]);
        
        if (sheetData && Object.keys(sheetData.moves).length > 0) {
          setData(sheetData);
          setSource('sheets');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn(`Sheets fetch failed for ${characterId}, using static:`, err.message);
      }
    }

    // Fall back to static data
    const staticData = STATIC_DATA[characterId];
    if (staticData) {
      setData(staticData);
      setSource('static');
    } else {
      setError(`No data available for character: ${characterId}`);
    }
    
    setLoading(false);
  }, [characterId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, source };
}

/**
 * Hook to get all characters data
 */
export function useAllCharactersData() {
  const [allData, setAllData] = useState(STATIC_DATA);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState({});

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const newData = { ...STATIC_DATA };
    const newSources = {};

    for (const characterId of Object.keys(STATIC_DATA)) {
      const hasSheetConfig = CHARACTER_GIDS[characterId] !== null && 
                            CHARACTER_GIDS[characterId] !== undefined;
      
      if (USE_SHEETS_PRIMARY && hasSheetConfig) {
        try {
          const sheetData = await fetchCharacterFromSheet(characterId);
          if (sheetData && Object.keys(sheetData.moves).length > 0) {
            newData[characterId] = sheetData;
            newSources[characterId] = 'sheets';
            continue;
          }
        } catch (err) {
          console.warn(`Sheets fetch failed for ${characterId}`);
        }
      }
      newSources[characterId] = 'static';
    }

    setAllData(newData);
    setSources(newSources);
    setLoading(false);
  }, []);

  return { allData, loading, refreshAll, sources };
}

/**
 * Get static data directly (no async)
 */
export function getStaticData(characterId) {
  return STATIC_DATA[characterId] || null;
}

/**
 * Get all static data
 */
export function getAllStaticData() {
  return STATIC_DATA;
}

export default {
  useCharacterData,
  useAllCharactersData,
  getStaticData,
  getAllStaticData
};
