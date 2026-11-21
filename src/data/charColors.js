// Per-character art gradient, sampled from public/art/<id>.jpg so the card container echoes the art.
export const ART_COLORS = {
  "aki": [
    "#82344b",
    "#723370"
  ],
  "akuma": [
    "#af5f4e",
    "#723d33"
  ],
  "alex": [
    "#b58c51",
    "#721919"
  ],
  "arjun": [
    "#986d44",
    "#762b25"
  ],
  "blanka": [
    "#d8cd55",
    "#1a7234"
  ],
  "cammy": [
    "#353372",
    "#334c72"
  ],
  "chunli": [
    "#61abd8",
    "#396580"
  ],
  "cviper": [
    "#464b9c",
    "#72223b"
  ],
  "deejay": [
    "#d7bc47",
    "#724933"
  ],
  "dhalsim": [
    "#ac6938",
    "#724525"
  ],
  "ed": [
    "#336672",
    "#72335b"
  ],
  "ehonda": [
    "#d8a361",
    "#6b7229"
  ],
  "elena": [
    "#b1642c",
    "#d8c861"
  ],
  "guile": [
    "#667233",
    "#723619"
  ],
  "ingrid": [
    "#3c3372",
    "#7a4293"
  ],
  "jamie": [
    "#d8bc61",
    "#723d24"
  ],
  "jp": [
    "#72336c",
    "#722c31"
  ],
  "juri": [
    "#831e70",
    "#532e72"
  ],
  "ken": [
    "#b46f36",
    "#72201a"
  ],
  "kimberly": [
    "#d81e0e",
    "#d8a953"
  ],
  "lily": [
    "#975243",
    "#336472"
  ],
  "luke": [
    "#d8d461",
    "#121772"
  ],
  "mai": [
    "#d89061",
    "#7b5237"
  ],
  "manon": [
    "#61aed8",
    "#723346"
  ],
  "marisa": [
    "#bb1b0e",
    "#d8a061"
  ],
  "mbison": [
    "#364b7a",
    "#5e3372"
  ],
  "random": [
    "#4b5563",
    "#1f2937"
  ],
  "rashid": [
    "#af6423",
    "#724116"
  ],
  "ryu": [
    "#d8aa61",
    "#72332d"
  ],
  "sagat": [
    "#d8b861",
    "#7a6736"
  ],
  "terry": [
    "#8d1f18",
    "#721913"
  ],
  "yasmine": [
    "#409eba",
    "#b4516c"
  ],
  "zangief": [
    "#bf1c19",
    "#d89761"
  ]
};

export const artGradient = (id) => {
  const [a, b] = ART_COLORS[id === 'bison' ? 'mbison' : id] || ['#4b5563', '#1f2937'];
  return `linear-gradient(135deg, ${a}, ${b})`;
};
