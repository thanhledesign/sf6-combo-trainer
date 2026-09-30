// Curated list of SF6 stages. Used in the match-entry stage selector and
// the stage win-rate heatmap. User can extend by editing this file.
// Display order: alphabetical for easy scan.

export const SF6_STAGES = [
  { id: 'beautiful-sunday',     label: 'Beautiful Sunday in Old Russia' },
  { id: 'carrier-byron-taylor', label: 'Carrier Byron Taylor' },
  { id: 'crash-and-brawl',      label: 'Crash and Brawl' },
  { id: 'eternal-bath',         label: 'Eternal Bath' },
  { id: 'game-face',            label: 'Game Face' },
  { id: 'genbu-temple',         label: 'Genbu Temple' },
  { id: 'hangout-spot',         label: 'Hangout Spot' },
  { id: 'kings-dinner',         label: "King's Dinner" },
  { id: 'lock-on',              label: 'Lock-On' },
  { id: 'macho-ring',           label: 'The Macho Ring' },
  { id: 'metro-city-downtown',  label: 'Metro City Downtown' },
  { id: 'reflective-volcano',   label: 'Reflective Volcano' },
  { id: 'suvalhal-arena',       label: "Suval'hal Arena" },
  { id: 'tian-hong-yuan',       label: 'Tian Hong Yuan' },
  { id: 'trans-saharan',        label: 'Trans-Saharan Express' },
];

export const STAGE_BY_ID = Object.fromEntries(SF6_STAGES.map((s) => [s.id, s]));
