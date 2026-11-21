// Single source for character thumbnails (Figma 1:1 art, 256px, in public/thumbs/).
// App character ids map to file names; only M. Bison differs (bison → mbison).
const FILE = { bison: 'mbison' };
const KNOWN = new Set(['aki','akuma','alex','arjun','blanka','cammy','chunli','cviper','deejay','dhalsim','ed','ehonda','elena','guile','ingrid','jamie','jp','juri','ken','kimberly','lily','luke','mai','manon','marisa','bison','mbison','rashid','ryu','sagat','terry','yasmine','zangief']);
export const charThumb = (id) => (KNOWN.has(id) ? `/thumbs/${FILE[id] || id}.jpg` : null);
// 16:9 Figma art (1138x640, public/art/) for large cards, where the 256px square thumbs look soft.
export const charArt = (id) => (KNOWN.has(id) ? `/art/${FILE[id] || id}.jpg` : null);
export const THUMBS = Object.fromEntries([...KNOWN].map((id) => [id, charThumb(id)]));
