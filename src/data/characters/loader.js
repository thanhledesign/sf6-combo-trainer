// Merges layered character data into the monolithic Character object the
// app already consumes. Three layers, in precedence order (lowest → highest):
//   1. capcom        — machine-managed frame data (auto-generated in future)
//   2. overrides     — sparse human corrections to capcom values
//   3. annotations   — Thanh's IP (tactics, perspectives, tactical_tags)
//
// Annotations always wins for fields it owns; capcom always wins for frame
// numbers (overrides patch them sparsely). The merge is shallow at the move
// level with explicit nested handling for opponentPerspective / properties /
// frameData where both layers may contribute.

const capcomFiles      = import.meta.glob('../capcom/*.json',      { eager: true, import: 'default' });
const annotationFiles  = import.meta.glob('../annotations/*.json', { eager: true, import: 'default' });
const overrideFiles    = import.meta.glob('../overrides/*.json',   { eager: true, import: 'default' });

const byId = (obj) =>
  Object.fromEntries(
    Object.entries(obj).map(([path, mod]) => [path.match(/([^/]+)\.json$/)[1], mod]),
  );

const capcom      = byId(capcomFiles);
const annotations = byId(annotationFiles);
const overrides   = byId(overrideFiles);

function mergeMove(capcomMove = {}, overrideMove = {}, annotationMove = {}) {
  const cFrame = capcomMove.frameData ?? {};
  const oFrame = overrideMove.frameData ?? {};

  const cAdv = capcomMove.frameAdvantage ?? {};
  const oAdv = overrideMove.frameAdvantage ?? {};

  const cProps = capcomMove.properties ?? {};
  const oProps = overrideMove.properties ?? {};
  const aProps = annotationMove.properties ?? {};

  const aOpp = annotationMove.opponentPerspective ?? {};

  return {
    ...annotationMove,
    damage: overrideMove.damage ?? capcomMove.damage,
    frameData: { ...cFrame, ...oFrame },
    opponentPerspective: {
      ...aOpp,
      frameAdvantage: { ...cAdv, ...oAdv },
    },
    properties: {
      ...aProps,
      ...cProps,
      ...oProps,
    },
  };
}

export function loadCharacter(id) {
  const c = capcom[id]      ?? { moves: {} };
  const a = annotations[id] ?? { character: null, tactics: {}, moves: {} };
  const o = overrides[id]   ?? { moves: {} };

  const moveIds = new Set([
    ...Object.keys(c.moves ?? {}),
    ...Object.keys(a.moves ?? {}),
    ...Object.keys(o.moves ?? {}),
  ]);

  const moves = {};
  for (const moveId of moveIds) {
    moves[moveId] = mergeMove(c.moves?.[moveId], o.moves?.[moveId], a.moves?.[moveId]);
  }

  return {
    character: a.character,
    tactics:   a.tactics,
    moves,
  };
}

export const availableCharacterIds = Object.keys(annotations);
