// Character data — auto-discovered from src/data/annotations/*.json via the
// loader's availableCharacterIds. Adding a new character only requires
// dropping its three layered files into capcom/ + annotations/ + overrides/.

import { loadCharacter, availableCharacterIds } from './loader';

// Eagerly load every known character once at module init.
const map = Object.fromEntries(
  availableCharacterIds.map((id) => [id, loadCharacter(id)]),
);

// Named exports for the original 7 — preserves backward compat with
// existing imports in App.jsx and elsewhere.
export const ken     = map.ken;
export const ryu     = map.ryu;
export const luke    = map.luke;
export const chunli  = map.chunli;
export const cammy   = map.cammy;
export const mai     = map.mai;
export const terry   = map.terry;

export const characters = map;

// Sorted alphabetically by displayName for consistent menu ordering.
export const characterList = Object.entries(map)
  .map(([id, c]) => ({
    id,
    name: c.character?.name || c.character?.displayName || id,
    file: c,
  }))
  .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

export default characters;
