// Turns a Capcom `input` string into a list of icon tokens for normals, e.g.
//   'LP'                       -> { prefix: null, tokens: [btn LP] }
//   '↓ + HK'                   -> crouch
//   '(During a jump) ↗ + MP'   -> jump (arrow kept, ↗ becomes ↑ for neutral jump)
// Returns null when the input can't be shown purely as arrows + buttons, so callers fall back.
const ARROWS = { '↓': 2, '↙': 1, '↘': 3, '←': 4, '→': 6, '↖': 7, '↑': 8, '↗': 9 };
const BUTTONS = ['LP', 'MP', 'HP', 'LK', 'MK', 'HK'];

export function parseNormalInput(input) {
  if (!input || typeof input !== 'string') return null;
  const ctx = input.match(/^\(([^)]*)\)\s*/);
  const context = ctx ? ctx[1].toLowerCase() : '';
  let rest = (ctx ? input.slice(ctx[0].length) : input).trim();
  const jump = /jump/.test(context);
  if (context && !jump) return null; // Drive Parry / Sway / Crouch follow-ups etc.

  const tokens = [];
  for (const part of rest.split(/\s*\+\s*/)) {
    if (BUTTONS.includes(part)) tokens.push({ type: 'button', value: part });
    else if (part.length === 1 && ARROWS[part]) {
      let dir = ARROWS[part];
      if (jump && /neutral/.test(context) && dir === 9) dir = 8;
      tokens.push({ type: 'arrow', value: dir });
    } else return null;
  }
  if (!tokens.some(t => t.type === 'button')) return null;
  const crouch = !jump && tokens.some(t => t.type === 'arrow' && t.value === 2);
  return { tokens, label: jump ? 'Jumping' : crouch ? 'Crouching' : null };
}
