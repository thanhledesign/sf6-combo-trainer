// V01.33 — Session Lab. Hosts the standalone session tracker (public/lab/index.html)
// inside the app shell: shared password gate, shared nav, and a "Study" bridge
// that jumps from a logged opponent straight to their move browser.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { availableCharacterIds } from '../../data/characters/loader';

// Tracker uses display names ("M. Bison"); the app uses ids ("bison").
export function nameToCharacterId(name) {
  if (!name) return null;
  if (name === 'M. Bison') return 'bison';
  const key = String(name).toLowerCase().replace(/[^a-z]/g, '');
  return availableCharacterIds.includes(key) ? key : null;
}

export default function LabFrame({ pane = 'log' }) {
  const navigate = useNavigate();

  // The static page checks this flag when opened directly, so it can't be used
  // to skip the password gate. (Soft gate — same strength as the app's own.)
  useEffect(() => {
    try { sessionStorage.setItem('sf6-lab-ok', '1'); } catch { /* storage blocked */ }
  }, []);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data;
      if (d && d.sf6 === 'go' && typeof d.to === 'string' && d.to.startsWith('/')) {
        navigate(d.to);
        return;
      }
      if (!d || d.sf6 !== 'study') return;
      const id = nameToCharacterId(d.char);
      navigate(id ? `/browse/${id}` : '/characters');
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);

  return (
    <iframe
      key={pane}
      title="Session Lab"
      src={`/lab/index.html#${pane}`}
      className="w-full block border-0 bg-gray-900"
      style={{ height: 'calc(100dvh - 69px)' }}
    />
  );
}
