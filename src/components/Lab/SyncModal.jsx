import { useState } from 'react';
import { useSync, signIn, verifyCode, signOut, syncNow } from '../../lab/sync';
import { Overlay } from './ui';
import SyncGuide from './SyncGuide';

export default function SyncModal({ onClose }) {
  const s = useSync();
  const [email, setEmail] = useState(''), [sent, setSent] = useState(false), [code, setCode] = useState(''), [guide, setGuide] = useState(false);
  const signedIn = !!s.email;
  return (
    <Overlay onClose={onClose}>
      {guide && <SyncGuide onClose={() => setGuide(false)} />}
      <h2>Sync across devices</h2>
      {signedIn ? (
        <>
          <p>Signed in as <b>{s.email}</b>. {s.status === 'syncing' ? 'Syncing…' : s.status === 'error' ? 'Sync problem — will retry.' : s.at ? `Synced ${new Date(s.at).toLocaleTimeString()}.` : 'Connected.'}</p>
          {s.error && <p className="warn" style={{ fontSize: '.85rem' }}>{s.error}</p>}
          <p className="mute" style={{ fontSize: '.85rem' }}>Sessions, games, goals, combos, reviews and options are kept in sync. The app still works offline and catches up when you reconnect.</p>
          <div className="row2"><button type="button" className="btn primary" onClick={syncNow}>Sync now</button><button type="button" className="btn" onClick={() => signOut()}>Sign out</button></div>
        </>
      ) : (
        <>
          <p className="mute" style={{ fontSize: '.9rem' }}>Your data is stored only in this browser right now. Sign in with your email to keep it in sync on every device. Existing data here is uploaded the first time.</p>
          <label>Email<input type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {!sent ? (
            <div className="row2" style={{ marginTop: '.6rem' }}>
              <button type="button" className="btn primary" disabled={s.status === 'signing' || !email.includes('@')} onClick={async () => { if (await signIn(email.trim())) setSent(true); }}>Send sign-in link</button>
              <button type="button" className="btn" onClick={onClose}>Not now</button>
            </div>
          ) : (
            <>
              <p style={{ marginTop: '.6rem' }}>Check your email and open the link on this device. If the email shows a 6-digit code instead, enter it here:</p>
              <div className="row2"><input type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
                <button type="button" className="btn primary" onClick={() => verifyCode(email.trim(), code.trim())}>Verify code</button></div>
            </>
          )}
          {s.error && <p className="warn" style={{ fontSize: '.85rem' }}>{s.error}</p>}
        </>
      )}
      <p style={{ marginTop: '.8rem', fontSize: '.85rem' }}><button type="button" className="btn" onClick={() => setGuide(true)}>Walk me through saving &amp; syncing (iCloud, Files, more)</button></p>
    </Overlay>
  );
}
