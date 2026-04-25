#!/usr/bin/env node
// Apply Ken's tacticalTags from the 2026-04-25 hand-filled worksheet.
//
// Source: photo of "SF6 Combo Trainer Character Tactical Worksheet" by Thanh,
// dated 4/24/26, at MR rank 1606. Tag values per spec §3.3 (kebab-case).
//
// Run once:  node scripts/apply-ken-tactical-tags.mjs
// Idempotent: re-running just rewrites the same arrays.

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KEN  = resolve(ROOT, 'src/data/annotations/ken.json');

// Tag mapping derived from worksheet. Each entry: [moveId, [tags...]]
// Per spec: primary tag first, cap at 2 except for genuinely exceptional moves.
const TAGS = [
  // POKES
  ['ken_st_mk',         ['pokes']],                       // 5MK — target combo opener, KD
  ['ken_cr_mp',         ['pokes', 'meaties']],            // 2MP — best combo routes, also meaty (usually safe or +)
  ['ken_cr_mk',         ['pokes']],                       // 2MK — most reach, opens to SA3

  // ANTI-AIRS
  ['ken_shoryuken_l',   ['anti-airs']],                   // 623LP — most reliable AA
  ['ken_cr_hp',         ['anti-airs', 'drc-combo']],      // 2HP — easiest AA, also DRC route entry (5MP→2HP)

  // +OB
  ['ken_dragonlash_h',  ['plus-on-block', 'super-combo']],// 623HK — heavy dragonlash, also SA confirm via "sideswipe dragonlash"

  // SUPER ARTS
  ['ken_sa1',           ['super-arts', 'super-combo']],   // anti-DI / corner kill, combo target via flame
  ['ken_sa2',           ['super-arts', 'super-combo']],   // when will kill, after Run-Stomp→tatsu→shoryu
  ['ken_sa3',           ['super-arts', 'super-combo']],   // max damage, 1/match, combo ender

  // MEATIES
  ['ken_st_hp',         ['meaties', 'drc-combo']],        // 5HP after KD, follow w/ jinrai or DRC
  ['ken_gorai',         ['meaties']],                     // Gorai Axe Kick (HK→MK target combo), frame trap w/ 5LP

  // BURNOUT HARASSMENT
  ['ken_jinrai_m',      ['burnout', 'unique']],           // Medium jinrai loops 236K → stomp/overhead/bait

  // DRC COMBO (entries beyond what's already tagged above)
  ['ken_st_mp',         ['drc-combo']],                   // 5MP → 2HP into Run route
  ['ken_chin_buster',   ['drc-combo', 'super-combo']],    // primary DRC route + chin buster→flame→SA

  // UNIQUE MECHANICS — Run system
  ['ken_quick_dash',    ['unique']],                      // Run base — character-defining
  ['ken_emergency_stop',['unique']],                      // Run, cancel → bait
  ['ken_thunder_kick',  ['unique']],                      // Run, MK → overhead — meaties / counter-crouch
  ['ken_qd_dragonlash', ['unique']],                      // Run, HK → long poke (timer/low life zoning)
];

const ken = JSON.parse(readFileSync(KEN, 'utf8'));

let applied = 0;
let missing = [];
for (const [moveId, tags] of TAGS) {
  if (!ken.moves[moveId]) {
    missing.push(moveId);
    continue;
  }
  ken.moves[moveId].tacticalTags = tags;
  applied++;
}

writeFileSync(KEN, JSON.stringify(ken, null, 2) + '\n');

console.log(`Applied tacticalTags to ${applied}/${TAGS.length} moves`);
if (missing.length) {
  console.log(`Missing move IDs: ${missing.join(', ')}`);
  process.exit(1);
}

// Per-category coverage check (for sanity vs spec's 3-6 target)
const counts = {};
for (const [, tags] of TAGS) {
  for (const t of tags) counts[t] = (counts[t] || 0) + 1;
}
console.log('\nCategory coverage:');
for (const [t, n] of Object.entries(counts).sort()) {
  const flag = n < 3 ? '  (sparse — worksheet had limited entries)' : n > 6 ? '  (over cap)' : '';
  console.log(`  ${t.padEnd(16)} ${n}${flag}`);
}
