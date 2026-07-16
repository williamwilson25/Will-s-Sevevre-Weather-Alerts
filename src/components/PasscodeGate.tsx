import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { verifyPasscode } from '../utils/passcode';
import { LockIcon, LockOpenIcon } from './icons';

interface Props {
  children: ReactNode;
}

export default function PasscodeGate({ children }: Props) {
  const [unlocked, setUnlocked] = useLocalStorage<boolean>('sw_alerts_unlocked', false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError('');
    const ok = await verifyPasscode(input);
    setChecking(false);
    if (ok) {
      setUnlocked(true);
      setInput('');
    } else {
      setError('Wrong passcode.');
      setInput('');
    }
  }

  if (unlocked) {
    return (
      <div className="passcode-unlocked">
        <button
          type="button"
          className="passcode-relock"
          onClick={() => setUnlocked(false)}
          title="Lock this tab again on this device"
        >
          <LockOpenIcon size={14} /> Unlocked · tap to lock
        </button>
        {children}
      </div>
    );
  }

  return (
    <section className="passcode-gate">
      <div className="passcode-icon">
        <LockIcon size={30} />
      </div>
      <h2>Alerts are locked</h2>
      <p>Enter the passcode to manage friends and send alerts from this device.</p>
      <form onSubmit={handleSubmit} className="passcode-form">
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Passcode"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!input || checking}>
          {checking ? 'Checking…' : 'Unlock'}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
