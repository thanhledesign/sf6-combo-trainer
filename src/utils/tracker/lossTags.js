// Default loss-tag catalog from the V01.31 spec.
// User-extensible via trackerStore.addCustomLossTag().

/** @type {import('./types.js').LossTag[]} */
export const DEFAULT_LOSS_TAGS = [
  { id: 'no-anti-air',     label: "Didn't anti-air" },
  { id: 'lost-neutral-di', label: 'Lost neutral to DI' },
  { id: 'whiff-punished',  label: 'Whiff punished too much' },
  { id: 'dropped-combo',   label: 'Dropped combo' },
  { id: 'raw-dp',          label: 'Threw out raw DP' },
  { id: 'broken-throw',    label: "Couldn't break throw" },
  { id: 'poor-wakeup',     label: 'Poor wakeup defense' },
  { id: 'no-meter',        label: 'Ran out of meter at key moment' },
  { id: 'tilted',          label: 'Tilted / made bad reads' },
];
