// V01.33 Session Lab — static data shared by the tracker screens.

export const ROSTER = ['A.K.I.','Akuma','Alex','Arjun','Blanka','C. Viper','Cammy','Chun-Li','Dee Jay','Dhalsim','E. Honda','Ed','Elena','Guile','Ingrid','JP','Jamie','Juri','Ken','Kimberly','Lily','Luke','M. Bison','Mai','Manon','Marisa','Rashid','Ryu','Sagat','Terry','Yasmine','Zangief'];
export const OPP = [...ROSTER, 'Random'];

// [key, label, type]
export const DEFAULT_TAGS = [
  ['B','Burnout','leak'],['X','EX DP','leak'],['A','Ate jump-ins','leak'],['T','Ate 2+ throws','leak'],
  ['P','Pressed on minus','leak'],['E','Dropped input','leak'],['M','Real meaty','good'],
  ['W','Whiff punish','good'],['D','Blocked clean','good'],['R','Adapted','good'],
];

// Game plan themes (V01.44). Names only; the details live in the "Game Plans" tab of the SF6 Ranked Tracker sheet.
export const DEFAULT_THEMES = [
  ['throw','Throw loops'],['hotcold','Hot/Cold'],['alloffense','All-out offense'],
  ['bait','Bait and whiff punish'],['wall','Fireball and anti-air wall'],['oki','Corner trap and oki'],
  ['scout','Scout and read'],['block','Block and punish'],['skip','Neutral-skip shutdown'],['herd','Corner herding'],
  ['revbait','Reversal bait'],['overload','Overload their autopilot'],['burnout','Burnout pressure'],['impatience','Impatience bait'],
  ['driveeco','Drive economy'],['parry','Parry defense'],['rhythm','Rhythm break'],['crowd','Crowd their space'],
  ['dipunish','Drive Impact punish'],['cornerescape','Corner escape'],['jumpbait','Fireball jump bait'],['lead','Lead management'],
];

// Default game plan: 3 games x 3 rounds (G1R1..G3R3), theme keys. Mirrors the Game Plans tab of the sheet.
export const DEFAULT_PLAN = ['scout', 'bait', 'throw', 'alloffense', 'oki', 'hotcold', 'bait', 'throw', 'wall'];
// One-line reminder per default theme, shown in the plan bar. Editable per theme in the app.
export const THEME_TIPS = {
  throw: 'Make them respect the throw, then loop it. Tick, shimmy, throw again.',
  hotcold: 'Walk where they walk. Deny what they want. Do not press first.',
  alloffense: 'Patient before, now constant pressure. Never press on minus.',
  bait: 'Offer a bait, make it whiff or be unsafe, punish big.',
  wall: 'Hadoken and DP. Make them come to you. No risk.',
  oki: 'After the knockdown: meaty, safe jump, keep them cornered.',
  scout: 'Round 1: collect info, no risks. Skip? Corner? Footsies? Default defense?',
  block: 'Minus? Block and wait. Punish only what is really unsafe.',
  skip: 'Hadoken and st.MK stop the dash. Drive Impact the skip. Block the reversal.',
  herd: 'Walk them back outside cr.MK range. Wait for the mistake.',
  revbait: 'Anti-air the early jump, block the wake-up reversal, punish.',
  overload: 'Pressure until their default shows, then beat it. They repeat once.',
  burnout: 'They are in Burnout. Memorized mixups, keep them cornered.',
  impatience: 'Hold still. When the fireball comes, Drive Rush through the startup.',
  driveeco: 'Spend Drive and Super on confirmed hits. No raw Drive Impact. No Burnout.',
  parry: 'Parry the fireball or string, walk in, take the turn.',
  rhythm: 'Change your timing every few exchanges. Gaps on purpose.',
  crowd: 'Stand in their space. Block the panic, anti-air the jump.',
  dipunish: 'Block their Drive Impact and punish. Never throw yours raw.',
  cornerescape: 'Backdash, parry, delay tech. Vary it. Do not jump back.',
  jumpbait: 'Fireball at the jump arc edge, then anti-air the jump.',
  lead: 'Ahead: make them come. Behind: take reads, not random risk.',
};

// Loss tags from the V01.32 tracker, imported alongside its data.
export const CLASSIC_TAGS = [
  ['no-anti-air',"Didn't anti-air"],['lost-neutral-di','Lost neutral to DI'],['whiff-punished','Whiff punished too much'],
  ['dropped-combo','Dropped combo'],['raw-dp','Threw out raw DP'],['broken-throw',"Couldn't break throw"],
  ['poor-wakeup','Poor wakeup defense'],['no-meter','Ran out of meter at key moment'],['tilted','Tilted / made bad reads'],
];

export const MODES = [['ranked','Ranked'],['casual','Casual'],['room','Custom room'],['hub','Battle hub']];
export const KINDS = {
  mr:'Reach an MR', streak:'Win streak', beat:'Beat opponents at an MR or above',
  wins:'Win games', games:'Play games', custom:'Custom counter',
};
export const RV_CATS = ['Execution','Defense','Matchup','Awareness','Knowledge','Coaching violation'];
export const DEVICES = ['Pad','Stick','Hitbox'];

// Roster name -> thumbnail file in /public/thumbs
const THUMB = {
  'Random':'random','A.K.I.':'aki','Akuma':'akuma','Alex':'alex','Arjun':'arjun','Blanka':'blanka','C. Viper':'cviper',
  'Cammy':'cammy','Chun-Li':'chunli','Dee Jay':'deejay','Dhalsim':'dhalsim','E. Honda':'ehonda','Ed':'ed','Elena':'elena',
  'Guile':'guile','Ingrid':'ingrid','JP':'jp','Jamie':'jamie','Juri':'juri','Ken':'ken','Kimberly':'kimberly','Lily':'lily',
  'Luke':'luke','M. Bison':'mbison','Mai':'mai','Manon':'manon','Marisa':'marisa','Rashid':'rashid','Ryu':'ryu',
  'Sagat':'sagat','Terry':'terry','Yasmine':'yasmine','Zangief':'zangief',
};
export const thumbOf = (name) => (THUMB[name] ? `/thumbs/${THUMB[name]}.jpg` : null);

// Tracker names ("M. Bison") <-> app character ids ("bison")
export function nameToCharId(name, available) {
  if (!name) return null;
  if (name === 'M. Bison') return available.includes('bison') ? 'bison' : null;
  const key = String(name).toLowerCase().replace(/[^a-z]/g, '');
  return available.includes(key) ? key : null;
}
export function charIdToName(id) {
  if (id === 'bison') return 'M. Bison';
  for (const n of ROSTER) if (n.toLowerCase().replace(/[^a-z]/g, '') === id) return n;
  return id || null;
}
