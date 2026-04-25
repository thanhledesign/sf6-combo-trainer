// Per-character custom Tactics configurations: up to 5 named slots per
// character, persisted via platform/storage so they survive reloads.
//
// Each slot overrides the factory tacticalTags + supports user-defined
// per-category move ordering. When no slot is active, factory tags from
// src/data/annotations/<char>.json render.

import { storage } from './platform';
import { TACTICAL_CATEGORIES, TACTICAL_CATEGORY_BY_ID } from '../data/tacticalCategories';

export const MAX_SLOTS = 5;
const SCHEMA_VERSION = 1;

const keyFor = (characterId) => `sf6-tactics:${characterId}`;

const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const emptyDoc = (characterId) => ({
  schemaVersion: SCHEMA_VERSION,
  characterId,
  slots: [],
  activeSlotId: null,
});

/** Load the full slots document for a character. Always returns a valid doc. */
export async function loadSlotsDoc(characterId) {
  const stored = await storage.get(keyFor(characterId));
  if (!stored || stored.schemaVersion !== SCHEMA_VERSION) return emptyDoc(characterId);
  return stored;
}

async function saveDoc(doc) {
  await storage.set(keyFor(doc.characterId), doc);
}

export async function getActiveSlot(characterId) {
  const doc = await loadSlotsDoc(characterId);
  if (!doc.activeSlotId) return null;
  return doc.slots.find((s) => s.id === doc.activeSlotId) ?? null;
}

/** Build a slot snapshot from the current factory tags (annotations file). */
export function snapshotFactory(characterMoves, name = 'Custom') {
  const tags = {};
  for (const [moveId, move] of Object.entries(characterMoves)) {
    if (Array.isArray(move?.tacticalTags) && move.tacticalTags.length > 0) {
      tags[moveId] = [...move.tacticalTags];
    }
  }
  return {
    id: newId(),
    name,
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    tags,
    ordering: {},
  };
}

/** Create a new slot. Errors if at MAX_SLOTS. Returns the doc. */
export async function createSlot(characterId, slot) {
  const doc = await loadSlotsDoc(characterId);
  if (doc.slots.length >= MAX_SLOTS) {
    throw new Error(`Slot limit reached (${MAX_SLOTS}). Delete a slot first.`);
  }
  const ensured = { ...slot, id: slot.id || newId(), createdAt: slot.createdAt || Date.now(), modifiedAt: Date.now() };
  doc.slots.push(ensured);
  doc.activeSlotId = ensured.id;
  await saveDoc(doc);
  return doc;
}

export async function renameSlot(characterId, slotId, name) {
  const doc = await loadSlotsDoc(characterId);
  const slot = doc.slots.find((s) => s.id === slotId);
  if (!slot) return doc;
  slot.name = name;
  slot.modifiedAt = Date.now();
  await saveDoc(doc);
  return doc;
}

export async function deleteSlot(characterId, slotId) {
  const doc = await loadSlotsDoc(characterId);
  doc.slots = doc.slots.filter((s) => s.id !== slotId);
  if (doc.activeSlotId === slotId) doc.activeSlotId = null;
  await saveDoc(doc);
  return doc;
}

export async function setActiveSlot(characterId, slotId) {
  const doc = await loadSlotsDoc(characterId);
  doc.activeSlotId = slotId;
  await saveDoc(doc);
  return doc;
}

/** Update tags for one move. Pass empty array to clear. */
export async function updateMoveTags(characterId, slotId, moveId, tags) {
  const doc = await loadSlotsDoc(characterId);
  const slot = doc.slots.find((s) => s.id === slotId);
  if (!slot) return doc;
  if (tags && tags.length > 0) slot.tags[moveId] = tags;
  else delete slot.tags[moveId];
  slot.modifiedAt = Date.now();
  await saveDoc(doc);
  return doc;
}

/** Update explicit ordering for a category. Pass null to clear. */
export async function updateOrdering(characterId, slotId, categoryId, moveIds) {
  const doc = await loadSlotsDoc(characterId);
  const slot = doc.slots.find((s) => s.id === slotId);
  if (!slot) return doc;
  if (!slot.ordering) slot.ordering = {};
  if (moveIds && moveIds.length > 0) slot.ordering[categoryId] = moveIds;
  else delete slot.ordering[categoryId];
  slot.modifiedAt = Date.now();
  await saveDoc(doc);
  return doc;
}

/** Update the order of categories themselves (the 9 sections). Pass null to revert to default. */
export async function updateCategoryOrder(characterId, slotId, categoryIds) {
  const doc = await loadSlotsDoc(characterId);
  const slot = doc.slots.find((s) => s.id === slotId);
  if (!slot) return doc;
  if (categoryIds && categoryIds.length > 0) slot.categoryOrder = categoryIds;
  else delete slot.categoryOrder;
  slot.modifiedAt = Date.now();
  await saveDoc(doc);
  return doc;
}

// ─── Validation ───────────────────────────────────────────────────────

/**
 * Returns { ok: true } or { ok: false, reason: string }.
 * Hard-blocks on objective category mismatches (+OB needs onBlock ≥ 0,
 * super-arts needs category === 'super'). Other categories pass freely.
 */
export function validateMoveForCategory(move, categoryId) {
  const cat = TACTICAL_CATEGORY_BY_ID[categoryId];
  if (!cat) return { ok: false, reason: `Unknown category: ${categoryId}` };

  if (categoryId === 'plus-on-block') {
    const ob = move?.opponentPerspective?.frameAdvantage?.onBlock;
    if (typeof ob !== 'number') return { ok: false, reason: `${move.displayName || move.id} has no on-block frame data — can't be tagged +OB.` };
    if (ob < 0) return { ok: false, reason: `${move.displayName || move.id} is ${ob} on block — must be 0 or positive for +OB.` };
  }

  if (categoryId === 'super-arts') {
    const isSuper = move?.category === 'super' || /23623[6P]|21421[4P]|6321[4P]/i.test(move?.notation || '');
    if (!isSuper) return { ok: false, reason: `${move.displayName || move.id} doesn't look like a Super Art (no 236236 / 214214 / 63214 input). If this is wrong, edit the move's category first.` };
  }

  return { ok: true };
}

// ─── Import / Export ──────────────────────────────────────────────────

/**
 * Returns a serializable object representing one slot. Suitable for
 * JSON.stringify and download. Includes characterId so receivers know
 * what character the slot is for.
 */
export function exportSlot(characterId, slot) {
  return {
    schemaVersion: SCHEMA_VERSION,
    type: 'sf6-trainer-tactics-slot',
    exportedAt: new Date().toISOString(),
    characterId,
    slot: {
      name: slot.name,
      createdAt: slot.createdAt,
      tags: slot.tags,
      ordering: slot.ordering || {},
    },
  };
}

/**
 * Imports a slot payload. Validates schema, optionally renames if a
 * slot with that name already exists, returns the new doc.
 * Errors if at MAX_SLOTS or characterId mismatch.
 */
export async function importSlot(characterId, payload) {
  if (!payload || payload.type !== 'sf6-trainer-tactics-slot') {
    throw new Error('Not a valid SF6 trainer tactics slot file.');
  }
  if (payload.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Schema version mismatch (got ${payload.schemaVersion}, expected ${SCHEMA_VERSION}).`);
  }
  if (payload.characterId !== characterId) {
    throw new Error(`This slot is for "${payload.characterId}", not "${characterId}".`);
  }
  const doc = await loadSlotsDoc(characterId);
  if (doc.slots.length >= MAX_SLOTS) {
    throw new Error(`Slot limit reached (${MAX_SLOTS}). Delete a slot first.`);
  }
  let name = payload.slot.name || 'Imported';
  // De-dupe name
  const existingNames = new Set(doc.slots.map((s) => s.name));
  if (existingNames.has(name)) {
    let i = 2;
    while (existingNames.has(`${name} (${i})`)) i++;
    name = `${name} (${i})`;
  }
  return createSlot(characterId, {
    name,
    tags: payload.slot.tags || {},
    ordering: payload.slot.ordering || {},
  });
}

// ─── Render-time helpers ──────────────────────────────────────────────

/**
 * Apply a slot's tag overrides + ordering to a character.moves dict,
 * returning a new dict where each move has the slot's tacticalTags and
 * an _orderingByCategory side-channel for the filter.
 */
export function applySlot(characterMoves, slot) {
  if (!slot) return { moves: characterMoves, ordering: null };
  const out = {};
  for (const [moveId, move] of Object.entries(characterMoves)) {
    out[moveId] = {
      ...move,
      tacticalTags: slot.tags[moveId] || [],
    };
  }
  return { moves: out, ordering: slot.ordering || null };
}

export { TACTICAL_CATEGORIES };
