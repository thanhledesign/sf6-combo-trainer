// Single source of truth for the 9 tactical categories from
// docs/_handoff-2026-04-24/04-TACTICAL-IA-SPEC.md §3.3.
//
// Order is the canonical display order on the Tactics page.
// The implicit grouping divider falls between order 4 and 5
// ("your toolkit" vs "your situational plays" — spec §6.1).

export const TACTICAL_CATEGORIES = [
  { id: 'pokes',         label: 'Pokes',                question: 'What do I throw at neutral range?',          order: 1 },
  { id: 'anti-airs',     label: 'Anti-Airs',            question: 'How do I stop their jump-in?',               order: 2 },
  { id: 'plus-on-block', label: '+OB',                  question: 'What can I press after they block?',         order: 3 },
  { id: 'super-arts',    label: 'Super Arts',           question: 'When do I use SA1/SA2/SA3?',                 order: 4 },
  { id: 'meaties',       label: 'Meaties',              question: 'What do I press on their wakeup?',           order: 5 },
  { id: 'burnout',       label: 'Burnout Harassment',   question: 'Dirtiest pressure when they’re in burnout?', order: 6 },
  { id: 'drc-combo',     label: 'DRC Combo',            question: 'Bread-and-butter Drive Rush route?',         order: 7 },
  { id: 'super-combo',   label: 'Super Arts Combo',     question: 'How do I confirm into super?',               order: 8 },
  { id: 'unique',        label: 'Unique Mechanics',     question: 'Character-defining tools?',                  order: 9 },
];

// The divider between "toolkit" (1–4) and "situational plays" (5–9)
// renders after the category whose order === DIVIDER_AFTER_ORDER.
export const DIVIDER_AFTER_ORDER = 4;

export const TACTICAL_CATEGORY_BY_ID = Object.fromEntries(
  TACTICAL_CATEGORIES.map((c) => [c.id, c]),
);
