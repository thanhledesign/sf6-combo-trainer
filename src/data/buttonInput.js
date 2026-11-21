// Turns a Capcom `input` string into icon tokens (arrows + buttons) so every move card can show its
// command as official button art instead of a video, e.g.
//   'LP'                              -> [btn LP]
//   '↓↘→ + LP'                        -> [arrow 2, 3, 6, plus, btn LP]
//   '(During a jump) ↗ + MP'          -> caption 'During a jump', [arrow 9, plus, btn MP]
//   '↓↘→↓↘→ + P'                      -> two motions + generic punch
// Returns null when the input can't be shown purely as arrows + buttons, so callers fall back.
const ARROWS = { '↓': 2, '↙': 1, '↘': 3, '←': 4, '→': 6, '↖': 7, '↑': 8, '↗': 9 };
const BUTTON_RE = /^(LP|MP|HP|LK|MK|HK)/;

export function parseInput(input) {
  if (!input || typeof input !== 'string') return null;
  let rest = input.trim();
  const ctxs = [];
  let m;
  while ((m = rest.match(/^\(([^)]*)\)\s*/))) { ctxs.push(m[1].trim()); rest = rest.slice(m[0].length); }
  const context = ctxs.join(' · ');
  const jump = /jump/i.test(context);

  const tokens = [];
  let i = 0;
  while (i < rest.length) {
    const ch = rest[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '+') { tokens.push({ type: 'plus' }); i++; continue; }
    if (ch === '/') { tokens.push({ type: 'slash' }); i++; continue; }
    if (ARROWS[ch]) {
      let dir = ARROWS[ch];
      if (jump && /neutral/i.test(context) && dir === 9) dir = 8;
      tokens.push({ type: 'arrow', value: dir }); i++; continue;
    }
    if (/[1-9]/.test(ch)) { tokens.push(ch === '5' ? { type: 'neutral' } : { type: 'arrow', value: Number(ch) }); i++; continue; }
    const b = rest.slice(i).match(BUTTON_RE);
    if (b) { tokens.push({ type: 'button', value: b[1] }); i += 2; continue; }
    if (ch === 'P' || ch === 'K') { tokens.push({ type: 'generic', value: ch }); i++; continue; }
    return null; // unknown glyph (e.g. a Capcom-only icon): don't guess
  }
  const hasPress = tokens.some((t) => t.type === 'button' || t.type === 'generic');
  if (!hasPress) {
    // directions only (e.g. Drive Rush "→→") are still worth showing
    if (!tokens.some((t) => t.type === 'arrow')) return null;
  }
  const dirs = tokens.filter((t) => t.type === 'arrow');
  const crouch = !jump && dirs.length === 1 && dirs[0].value === 2 && tokens.filter((t) => t.type !== 'plus').length === 2;
  return { tokens, context: context || null, label: jump ? 'Jumping' : crouch ? 'Crouching' : null };
}

// Back-compat: normals only ever had a plain command, so the old name keeps working.
export const parseNormalInput = parseInput;
