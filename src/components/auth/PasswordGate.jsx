import { useState } from 'react';

const SITE_PASSWORD = (import.meta.env.VITE_SITE_PASSWORD || 'shoryuken').trim();
const STORAGE_KEY = 'sf6-trainer-password-ok';

export function isPasswordRequired() {
  return Boolean(SITE_PASSWORD);
}

export function isPasswordValid() {
  if (!SITE_PASSWORD) return true;
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

// onSuccess is no longer used — gate reloads the page on success so the
// service worker is in control before route assets fetch. Kept in the prop
// signature would be misleading; consumers should not depend on it.
export function PasswordGate() {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      // Reload so the service worker is in control before route assets fetch.
      // Without this, post-unlock route mounts can race against SW activation
      // and miss precached assets until manual refresh.
      window.location.reload();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 safe-y safe-x">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">SF6 Combo Trainer</h1>
          <p className="text-sm text-gray-400">Enter password to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-800 border border-gray-700 rounded-2xl p-6"
        >
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`w-full px-4 py-3 bg-gray-900 border rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none transition-colors ${
              error ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'
            }`}
          />
          {error && <p className="text-xs text-red-500 mt-2">Incorrect password</p>}
          <button
            type="submit"
            className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Enter
          </button>
        </form>

        <p className="text-[10px] text-gray-500 text-center mt-4">
          This site is password-protected during beta.
        </p>
      </div>
    </div>
  );
}
