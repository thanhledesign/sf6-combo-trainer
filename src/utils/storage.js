/**
 * SF6 Combo Trainer - Storage Abstraction Layer
 * 
 * Purpose: Abstract storage operations so we can swap localStorage
 * for native storage (Capacitor Preferences) without changing app code.
 * 
 * Usage:
 *   import storage from '@/utils/storage';
 *   
 *   // Save data
 *   await storage.set('favorites', ['ken_st_hp', 'ryu_hadoken_l']);
 *   
 *   // Load data
 *   const favorites = await storage.get('favorites');
 *   
 *   // Remove data
 *   await storage.remove('favorites');
 * 
 * Future Migration:
 *   When adding Capacitor, uncomment the Capacitor imports and
 *   swap the implementation to use Preferences API.
 */

// ===========================================
// FUTURE: Uncomment when Capacitor is added
// ===========================================
// import { Preferences } from '@capacitor/preferences';

// ===========================================
// STORAGE KEYS - Define all keys here for consistency
// ===========================================
export const STORAGE_KEYS = {
  FAVORITES: 'sf6_favorites',
  STUDY_PROGRESS: 'sf6_study_progress',
  SETTINGS: 'sf6_settings',
  LAST_CHARACTER: 'sf6_last_character',
  COMPLETED_QUIZZES: 'sf6_completed_quizzes',
  CUSTOM_COMBOS: 'sf6_custom_combos',
};

// ===========================================
// CURRENT: localStorage implementation
// ===========================================
const storage = {
  /**
   * Get a value from storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} - Parsed value or null
   */
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set a value in storage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove a value from storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} - Success status
   */
  async remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage remove error for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all app storage
   * @returns {Promise<boolean>} - Success status
   */
  async clear() {
    try {
      // Only clear our app's keys, not everything
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  /**
   * Get all keys stored by our app
   * @returns {Promise<string[]>} - Array of keys
   */
  async keys() {
    try {
      return Object.values(STORAGE_KEYS).filter(key => 
        localStorage.getItem(key) !== null
      );
    } catch (error) {
      console.error('Storage keys error:', error);
      return [];
    }
  },
};

// ===========================================
// FUTURE: Capacitor Preferences implementation
// ===========================================
/*
const storage = {
  async get(key) {
    try {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Storage get error for key "${key}":`, error);
      return null;
    }
  },

  async set(key, value) {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value),
      });
      return true;
    } catch (error) {
      console.error(`Storage set error for key "${key}":`, error);
      return false;
    }
  },

  async remove(key) {
    try {
      await Preferences.remove({ key });
      return true;
    } catch (error) {
      console.error(`Storage remove error for key "${key}":`, error);
      return false;
    }
  },

  async clear() {
    try {
      await Preferences.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  async keys() {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('Storage keys error:', error);
      return [];
    }
  },
};
*/

export default storage;

// ===========================================
// CONVENIENCE HOOKS (optional, for React components)
// ===========================================

/**
 * Example usage in a component:
 * 
 * import { useFavorites } from '@/utils/storage';
 * 
 * function MoveCard({ move }) {
 *   const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
 *   
 *   return (
 *     <button onClick={() => 
 *       isFavorite(move.id) ? removeFavorite(move.id) : addFavorite(move.id)
 *     }>
 *       {isFavorite(move.id) ? '★' : '☆'}
 *     </button>
 *   );
 * }
 */

// This would go in a separate hooks file, but showing here for reference:
/*
import { useState, useEffect } from 'react';
import storage, { STORAGE_KEYS } from '@/utils/storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    storage.get(STORAGE_KEYS.FAVORITES).then(data => {
      setFavorites(data || []);
    });
  }, []);

  const addFavorite = async (moveId) => {
    const newFavorites = [...favorites, moveId];
    setFavorites(newFavorites);
    await storage.set(STORAGE_KEYS.FAVORITES, newFavorites);
  };

  const removeFavorite = async (moveId) => {
    const newFavorites = favorites.filter(id => id !== moveId);
    setFavorites(newFavorites);
    await storage.set(STORAGE_KEYS.FAVORITES, newFavorites);
  };

  const isFavorite = (moveId) => favorites.includes(moveId);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
*/
