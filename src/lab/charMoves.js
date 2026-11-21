// Move lists (with ids) for a tracker character name, cached. Feeds the combo damage engine.
import { characters } from '../data/characters';
import { nameToCharId } from './data';

const ids = Object.keys(characters), cache = new Map();
export function movesFor(name) {
  if (cache.has(name)) return cache.get(name);
  const id = nameToCharId(name, ids), c = id && characters[id];
  const list = c ? Object.entries(c.moves || {}).map(([k, m]) => ({ ...m, id: m.id || k })) : [];
  cache.set(name, list);
  return list;
}
