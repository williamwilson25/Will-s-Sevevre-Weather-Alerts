import { useState } from 'react';
import type { FormEvent } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthErrorCodes } from 'firebase/auth';
import type { AuthError } from 'firebase/auth';
import { auth } from '../firebase';
import logo from '../assets/logo.png';
import background from '../assets/background.jpg';

export default function SignIn() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(friendlyAuthError(err as AuthError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-bg" style={{ backgroundImage: `url(${background})` }}>
      <div className="auth-screen">
        <div className="auth-card">
          <img src={logo} alt="" className="auth-logo" />
          <h1>Will's Severe Weather Alerts</h1>
          <p className="auth-subtitle">
            {mode === 'signin' ? 'Sign in to continue' : 'Create an account to continue'}
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <button
            type="button"
            className="auth-toggle"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

function friendlyAuthError(err: AuthError): string {
  switch (err.code) {
    case AuthErrorCodes.INVALID_EMAIL:
      return 'That email address looks invalid.';
    case AuthErrorCodes.USER_DELETED:
    case AuthErrorCodes.INVALID_PASSWORD:
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case AuthErrorCodes.EMAIL_EXISTS:
      return 'An account with that email already exists.';
    case AuthErrorCodes.WEAK_PASSWORD:
      return 'Password should be at least 6 characters.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
