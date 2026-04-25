// Persistent storage abstraction.
// Web: localStorage. Future Capacitor: @capacitor/preferences.
// Async-first so the surface matches Capacitor without a refactor.

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const storage = {
  async get(key) {
    if (!isBrowser) return null;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  },

  async set(key, value) {
    if (!isBrowser) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key) {
    if (!isBrowser) return;
    window.localStorage.removeItem(key);
  },

  async clear() {
    if (!isBrowser) return;
    window.localStorage.clear();
  },

  async keys() {
    if (!isBrowser) return [];
    return Object.keys(window.localStorage);
  },
};
