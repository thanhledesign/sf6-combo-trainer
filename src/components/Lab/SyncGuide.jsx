import { useState } from 'react';
import { Overlay } from './ui';

// Step-by-step help for getting your data saved/synced. Shown from the Sync
// dialog and from Options. Every user's data is private to their own browser
// (and, once signed in, to their own account) — nothing is shared by default.
const PATHS = [
  {
    id: 'local', title: 'Just this device', tag: 'No setup',
    steps: [
      'Nothing to do — every session, game, combo and review you save is stored in this browser automatically.',
      'It stays private to this device and works offline. Clearing site data or switching browsers starts you fresh.',
      'Tip: use Options → "Back up data (JSON)" now and then as a safety copy you can keep anywhere.',
    ],
  },
  {
    id: 'email', title: 'Sync across devices (email)', tag: 'Recommended · free',
    steps: [
      'Tap the sync button (top of the Tracker) and enter your email.',
      'Open the email on the same device and tap the sign-in link. On an iPhone/iPad home-screen app, use the 6-digit code from the email instead and type it into the app — links open in Safari, not the app.',
      'Your existing data uploads once, then every device you sign in on stays in sync (works offline, catches up later).',
      'Sign in with the same email on your other devices. Your data is only visible to your account.',
      'No email? Check spam, wait a minute, and try again — free email sending is limited to a few per hour.',
    ],
  },
  {
    id: 'file', title: 'Backup file', tag: 'Manual',
    steps: [
      'Options → "Back up data (JSON)" downloads one file with everything: sessions, games, goals, combos and reviews.',
      'Keep it wherever you like (your own cloud drive, email it to yourself, etc.).',
      'To restore on another device or browser: Options → "Import backup" and pick that file. Records already there are kept; only new ones are added.',
    ],
  },
  {
    id: 'home', title: 'Add to Home Screen', tag: 'Optional',
    steps: [
      'iPhone/iPad: open the site in Safari → Share → Add to Home Screen. Android/Chrome: ⋮ menu → Install app.',
      'It then opens full-screen like an app and keeps working offline.',
      'Home-screen apps keep their own storage on iOS — sign in there once (use the 6-digit code) so it syncs with your browser.',
    ],
  },
];

export default function SyncGuide({ onClose }) {
  const [open, setOpen] = useState('email');
  return (
    <Overlay onClose={onClose}>
      <h2>Save &amp; sync guide</h2>
      <p className="mute" style={{ fontSize: '.85rem' }}>Your records are yours alone — each person who opens the app gets their own empty tracker, history and combo library. Pick how you want yours kept safe:</p>
      {PATHS.map((p) => (
        <div key={p.id} style={{ borderTop: '1px solid var(--line)', padding: '.5rem 0' }}>
          <button type="button" aria-expanded={open === p.id} onClick={() => setOpen(open === p.id ? '' : p.id)}
            style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem', background: 'none', border: 0, color: 'var(--text)', font: 'inherit', fontWeight: 700, textAlign: 'left', minHeight: '2.4rem' }}>
            <span>{p.title}</span><span className="mute" style={{ fontSize: '.72rem', fontWeight: 600 }}>{p.tag} {open === p.id ? '▾' : '▸'}</span>
          </button>
          {open === p.id && <ol style={{ margin: '.3rem 0 .2rem 1.2rem', padding: 0, listStyle: 'decimal', fontSize: '.88rem', lineHeight: 1.45 }}>{p.steps.map((t, i) => <li key={i} style={{ marginBottom: '.35rem' }}>{t}</li>)}</ol>}
        </div>
      ))}
      <p style={{ marginTop: '.6rem' }}><button type="button" className="btn primary" onClick={onClose}>Got it</button></p>
    </Overlay>
  );
}
