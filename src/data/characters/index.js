// Character data — produced by merging the three-layer source files
// (../capcom, ../annotations, ../overrides) via loader.js.
//
// Public API is preserved: same named exports, same shapes. Consumers don't
// need to know the data is no longer monolithic JSON.

import { loadCharacter } from './loader';

export const ken     = loadCharacter('ken');
export const terry   = loadCharacter('terry');
export const chunli  = loadCharacter('chunli');
export const luke    = loadCharacter('luke');
export const cammy   = loadCharacter('cammy');
export const mai     = loadCharacter('mai');
export const ryu     = loadCharacter('ryu');

export const characters = { ken, terry, chunli, luke, cammy, mai, ryu };

export const characterList = [
  { id: 'ken',    name: 'Ken Masters',   file: ken    },
  { id: 'terry',  name: 'Terry Bogard',  file: terry  },
  { id: 'chunli', name: 'Chun-Li',       file: chunli },
  { id: 'luke',   name: 'Luke Sullivan', file: luke   },
  { id: 'cammy',  name: 'Cammy White',   file: cammy  },
  { id: 'mai',    name: 'Mai Shiranui',  file: mai    },
  { id: 'ryu',    name: 'Ryu',           file: ryu    },
];

export default characters;
