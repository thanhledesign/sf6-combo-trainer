#!/usr/bin/env node
// Compact XLSX from the Capcom data layer. exceljs with minimal styling
// so the base64 payload fits under 256KB (the upload size limit here).
// Google Sheets auto-styles most things nicely on import; we set only:
//   - frozen header row
//   - column widths
//   - bold + colored header row
//   - a single section-header row per move category (bold)
//   - auto-filter

import ExcelJS from 'exceljs';
import { readFileSync, readdirSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT   = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CAPCOM = resolve(ROOT, 'src/data/capcom');
const ANNOT  = resolve(ROOT, 'src/data/annotations');
const OUT_DIR = resolve(ROOT, 'docs');

// Split the roster into N groups so each XLSX stays under ~150KB (well
// under the 256KB base64 upload limit). Chars sorted alphabetically first.
const GROUPS = Number(process.env.XLSX_GROUPS || 3);

mkdirSync(OUT_DIR, { recursive: true });

const CATEGORY_ORDER = ['normal', 'unique', 'target_combo', 'throw', 'special', 'super'];
const CATEGORY_LABEL = {
  normal: 'Normal Moves', unique: 'Unique Moves', target_combo: 'Target Combos',
  throw: 'Throws', special: 'Special Moves', super: 'Super Arts',
};

const COLUMNS = [
  { key: 'displayName', header: 'Move',      width: 32 },
  { key: 'notation',    header: 'Notation',  width: 14 },
  { key: 'input',       header: 'Input',     width: 22 },
  { key: 'level',       header: 'Str',       width: 5  },
  { key: 'damage',      header: 'Damage',    width: 8  },
  { key: 'startup',     header: 'Startup',   width: 8  },
  { key: 'active',      header: 'Active',    width: 8  },
  { key: 'recovery',    header: 'Recovery',  width: 9  },
  { key: 'total',       header: 'Total',     width: 7  },
  { key: 'onBlock',     header: 'On Block',  width: 9  },
  { key: 'onHit',       header: 'On Hit',    width: 8  },
  { key: 'cancel',      header: 'Cancel',    width: 8  },
  { key: 'hitLevel',    header: 'Hit Level', width: 10 },
  { key: 'note',        header: 'Notes',     width: 60 },
];

const files = readdirSync(CAPCOM).filter((f) => f.endsWith('.json')).sort();
const characters = files.map((f) => {
  const capcom = JSON.parse(readFileSync(join(CAPCOM, f), 'utf8'));
  let annot = null;
  try { annot = JSON.parse(readFileSync(join(ANNOT, f), 'utf8')); } catch {}
  const displayName = annot?.character?.displayName || annot?.character?.name
                    || capcom.character?.title || capcom.id;
  return { id: capcom.id, displayName, capcom };
}).sort((a, b) => a.displayName.localeCompare(b.displayName));

// Chunk characters into groups
const chunkSize = Math.ceil(characters.length / GROUPS);
const groups = [];
for (let i = 0; i < characters.length; i += chunkSize) {
  groups.push(characters.slice(i, i + chunkSize));
}

async function buildBook(groupChars, groupIdx) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'sf6-combo-trainer';
  wb.created = new Date();

// Shared styles (created ONCE, applied by ref → much smaller file)
const purpleHeader = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } },
  font: { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 },
  alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
};
const sectionStyle = {
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } },
  font: { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 },
  alignment: { vertical: 'middle', horizontal: 'left', indent: 1 },
};

// Summary tab lists ALL characters (not just this group's) so each file
// shows the full context of what's spread across the split.
const summary = wb.addWorksheet('Summary', { views: [{ state: 'frozen', ySplit: 1 }] });
summary.columns = [
  { header: 'Character', key: 'name', width: 22 },
  { header: 'In this file?', key: 'here', width: 13 },
  { header: 'Total', key: 'total', width: 8 },
  { header: 'Normals', key: 'normal', width: 9 },
  { header: 'Uniques', key: 'unique', width: 9 },
  { header: 'Target Combos', key: 'tc', width: 13 },
  { header: 'Throws', key: 'throw', width: 8 },
  { header: 'Specials', key: 'special', width: 10 },
  { header: 'Supers', key: 'super', width: 8 },
];
Object.assign(summary.getRow(1), purpleHeader);
summary.getRow(1).height = 22;
const groupIds = new Set(groupChars.map((c) => c.id));
for (const c of characters) {
  const counts = { normal: 0, unique: 0, target_combo: 0, throw: 0, special: 0, super: 0 };
  for (const m of Object.values(c.capcom.moves ?? {})) if (counts[m.category] != null) counts[m.category]++;
  summary.addRow({
    name: c.displayName,
    here: groupIds.has(c.id) ? '✓' : '',
    total: Object.keys(c.capcom.moves ?? {}).length,
    normal: counts.normal, unique: counts.unique, tc: counts.target_combo,
    throw: counts.throw, special: counts.special, super: counts.super,
  });
}
summary.autoFilter = { from: 'A1', to: 'I1' };

// Per-character tabs for THIS group
for (const c of groupChars) {
  const sheet = wb.addWorksheet(c.displayName.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = COLUMNS.map((col) => ({ header: col.header, key: col.key, width: col.width }));
  const headerRow = sheet.getRow(1);
  headerRow.fill = purpleHeader.fill;
  headerRow.font = purpleHeader.font;
  headerRow.alignment = purpleHeader.alignment;
  headerRow.height = 22;

  const byCategory = {};
  for (const m of Object.values(c.capcom.moves ?? {})) {
    (byCategory[m.category] ??= []).push(m);
  }
  for (const cat of CATEGORY_ORDER) {
    const moves = byCategory[cat];
    if (!moves || moves.length === 0) continue;

    const sectionRow = sheet.addRow([CATEGORY_LABEL[cat] || cat]);
    sheet.mergeCells(sectionRow.number, 1, sectionRow.number, COLUMNS.length);
    const c1 = sectionRow.getCell(1);
    c1.fill = sectionStyle.fill;
    c1.font = sectionStyle.font;
    c1.alignment = sectionStyle.alignment;
    sectionRow.height = 18;

    moves.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    for (const m of moves) {
      sheet.addRow({
        displayName: m.displayName,
        notation:    m.notation ?? '',
        input:       m.input ?? '',
        level:       (m.level && /^[LMH]$/.test(m.level)) ? m.level : '',
        damage:      m.damage,
        startup:     m.frameData?.startup,
        active:      m.frameData?.active ?? m.frameData?.activeRange,
        recovery:    m.frameData?.recovery,
        total:       m.frameData?.total,
        onBlock:     m.frameAdvantage?.onBlock,
        onHit:       m.frameAdvantage?.onHit,
        cancel:      m.properties?.cancelFlags ?? '',
        hitLevel:    m.properties?.hitLevel ?? '',
        note:        m.note ?? m.context ?? '',
      });
    }
  }
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };
}

  const label = `${groupChars[0].displayName[0]}-${groupChars[groupChars.length - 1].displayName[0]}`;
  const outPath = resolve(OUT_DIR, `sf6-frame-data-part${groupIdx + 1}-${label}.xlsx`);
  await wb.xlsx.writeFile(outPath);
  return outPath;
}

const paths = [];
for (let i = 0; i < groups.length; i++) {
  const p = await buildBook(groups[i], i);
  paths.push(p);
  console.log(`Wrote ${p} (${groups[i].length} chars: ${groups[i].map((c) => c.displayName).join(', ')})`);
}
console.log(`\n${paths.length} files written.`);
