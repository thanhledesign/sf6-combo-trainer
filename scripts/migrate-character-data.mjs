#!/usr/bin/env node
// One-shot migration: split src/data/characters/{name}.json into three layers.
//
// Source-of-truth split:
//   capcom layer    — frame data: damage, frameData{}, frameAdvantage{}, hitLevel, cancelable
//   annotation layer — Thanh's IP: displayName, notation, tacticalUse, IA tactics, etc.
//   overrides layer  — sparse human corrections to capcom (starts empty)
//
// Run once:  node scripts/migrate-character-data.mjs
// Idempotent: re-running rewrites the layered files from the (now-deleted)
// monoliths if they still exist; otherwise no-ops.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const CHARS = ['ken', 'terry', 'chunli', 'luke', 'cammy', 'mai', 'ryu'];

const CAPCOM = resolve(ROOT, 'src/data/capcom');
const ANNOT  = resolve(ROOT, 'src/data/annotations');
const OVER   = resolve(ROOT, 'src/data/overrides');
[CAPCOM, ANNOT, OVER].forEach((d) => mkdirSync(d, { recursive: true }));

function splitMove(move) {
  const capcom = {};
  const annotation = {};

  for (const k of Object.keys(move)) {
    const v = move[k];
    if (k === 'damage' || k === 'frameData') {
      capcom[k] = v;
    } else if (k === 'opponentPerspective' && v && typeof v === 'object') {
      if (v.frameAdvantage) capcom.frameAdvantage = v.frameAdvantage;
      const annotOp = { ...v };
      delete annotOp.frameAdvantage;
      if (Object.keys(annotOp).length) annotation.opponentPerspective = annotOp;
    } else if (k === 'properties' && v && typeof v === 'object') {
      const propsCapcom = {};
      const propsAnnot = {};
      for (const pk of Object.keys(v)) {
        if (pk === 'hitLevel' || pk === 'cancelable') propsCapcom[pk] = v[pk];
        else propsAnnot[pk] = v[pk];
      }
      if (Object.keys(propsCapcom).length) capcom.properties = propsCapcom;
      if (Object.keys(propsAnnot).length) annotation.properties = propsAnnot;
    } else {
      annotation[k] = v;
    }
  }

  return { capcom, annotation };
}

let totalMoves = 0;
for (const id of CHARS) {
  const src = resolve(ROOT, `src/data/characters/${id}.json`);
  if (!existsSync(src)) {
    console.log(`SKIP ${id}: ${src} not found`);
    continue;
  }
  const monolith = JSON.parse(readFileSync(src, 'utf8'));

  const capcomDoc = { id, moves: {} };
  const annotDoc  = { character: monolith.character, tactics: monolith.tactics, moves: {} };

  for (const moveId of Object.keys(monolith.moves)) {
    const move = monolith.moves[moveId];
    const { capcom, annotation } = splitMove(move);
    capcomDoc.moves[moveId] = capcom;
    annotDoc.moves[moveId]  = { id: moveId, ...annotation };
    totalMoves++;
  }

  writeFileSync(resolve(CAPCOM, `${id}.json`), JSON.stringify(capcomDoc, null, 2) + '\n');
  writeFileSync(resolve(ANNOT,  `${id}.json`), JSON.stringify(annotDoc,  null, 2) + '\n');

  // overrides — only create if missing, never clobber
  const overPath = resolve(OVER, `${id}.json`);
  if (!existsSync(overPath)) {
    writeFileSync(overPath, JSON.stringify({ id, moves: {} }, null, 2) + '\n');
  }

  console.log(`OK ${id}: ${Object.keys(monolith.moves).length} moves split`);
}

console.log(`\nDone. ${CHARS.length} characters, ${totalMoves} moves migrated.`);
console.log(`  capcom:      src/data/capcom/`);
console.log(`  annotations: src/data/annotations/`);
console.log(`  overrides:   src/data/overrides/`);
