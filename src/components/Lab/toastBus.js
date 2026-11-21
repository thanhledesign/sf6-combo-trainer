// Tiny toast message bus for the Session Lab.
import { useSyncExternalStore } from 'react';

let toastMsg = '';
const toastL = new Set();
let toastTimer = null;
export function toast(m) {
  toastMsg = m; toastL.forEach((f) => f());
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastMsg = ''; toastL.forEach((f) => f()); }, 3500);
}

export const useToastMsg = () => useSyncExternalStore((f) => { toastL.add(f); return () => toastL.delete(f); }, () => toastMsg);
