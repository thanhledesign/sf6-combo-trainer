// Merges layered character data into the monolithic Character object the
// app already consumes. Three layers, in precedence order (lowest → highest):
//   1. annotations  — Thanh's IP (tactical use, perspectives, IA, tactical_tags)
//   2. capcom       — scraped from streetfighter.com (frame data, display
//                     names, bio, vitals)
//   3. overrides    — sparse human corrections to capcom values
//
// Capcom is the source of truth for objective fields. Annotations provide
// the tactical narrative. Overrides patch Capcom errors.

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

// Capcom-owned move fields. When capcom has a value, it wins over annotation.
// (Annotations may still hold these for moves the scraper couldn't match;
// in that case the annotation value falls through.)
const CAPCOM_DISPLAY_FIELDS = ['displayName', 'notation', 'input', 'shortName', 'category', 'level'];

function mergeMove(capcomMove = {}, overrideMove = {}, annotationMove = {}) {
  const cFrame = capcomMove.frameData ?? {};
  const oFrame = overrideMove.frameData ?? {};

  const cAdv = capcomMove.frameAdvantage ?? {};
  const oAdv = overrideMove.frameAdvantage ?? {};

  const cProps = capcomMove.properties ?? {};
  const oProps = overrideMove.properties ?? {};
  const aProps = annotationMove.properties ?? {};

  const aOpp = annotationMove.opponentPerspective ?? {};

  // Build the merged move starting from the annotation, then overlay capcom
  // for objective fields, then override for sparse corrections.
  const merged = { ...annotationMove };
  for (const f of CAPCOM_DISPLAY_FIELDS) {
    if (capcomMove[f] != null) merged[f] = capcomMove[f];
  }
  merged.damage = overrideMove.damage ?? capcomMove.damage ?? annotationMove.damage ?? null;
  merged.frameData = { ...(annotationMove.frameData ?? {}), ...cFrame, ...oFrame };
  merged.opponentPerspective = {
    ...aOpp,
    frameAdvantage: { ...(aOpp.frameAdvantage ?? {}), ...cAdv, ...oAdv },
  };
  merged.properties = { ...aProps, ...cProps, ...oProps };
  if (capcomMove.note) merged.note = capcomMove.note;
  return merged;
}

function mergeCharacter(annotChar = {}, capcomChar = {}) {
  const aV = annotChar.vitals ?? {};
  const cV = capcomChar.vitals ?? {};
  return {
    ...annotChar,
    ...(capcomChar.bio && { bio: capcomChar.bio }),
    vitals: {
      ...aV,
      ...(cV.height && { height: cV.height }),
      ...(cV.weight && { weight: cV.weight }),
      ...(cV.likes  && { likes:  cV.likes }),
      ...(cV.hates  && { hates:  cV.hates }),
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
    character: mergeCharacter(a.character, c.character),
    tactics:   a.tactics,
    moves,
  };
}

export const availableCharacterIds = Object.keys(annotations);
