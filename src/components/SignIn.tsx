import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthErrorCodes } from 'firebase/auth';
import type { AuthError } from 'firebase/auth';
import type { Location } from '../types';
import { auth, DISCORD_INVITE_URL } from '../firebase';
import { detectLocation } from '../api/geolocation';
import { searchLocations } from '../api/weather';
import { saveSubscriber } from '../api/subscribers';
import { MapPinIcon, DiscordIcon } from './icons';
import logo from '../assets/logo.png';

type LocationStatus = 'idle' | 'detecting' | 'detected' | 'manual';

export default function SignIn() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [location, setLocation] = useState<Location | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationError, setLocationError] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Location[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  useEffect(() => {
    if (mode !== 'signup' || locationStatus !== 'idle') return;
    setLocationStatus('detecting');
    detectLocation()
      .then((loc) => {
        setLocation(loc);
        setLocationStatus('detected');
      })
      .catch((err) => {
        setLocationError(err instanceof Error ? err.message : 'Could not detect your location.');
        setLocationStatus('manual');
      });
  }, [mode, locationStatus]);

  useEffect(() => {
    if (locationStatus !== 'manual' || locationQuery.trim().length < 2) {
      setLocationResults([]);
      return;
    }
    setSearchingLocation(true);
    const handle = setTimeout(() => {
      searchLocations(locationQuery)
        .then(setLocationResults)
        .catch(() => setLocationResults([]))
        .finally(() => setSearchingLocation(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [locationQuery, locationStatus]);

  function selectManualLocation(loc: Location) {
    setLocation(loc);
    setLocationStatus('detected');
    setLocationQuery('');
    setLocationResults([]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!phone.trim()) {
        setError('Add a phone number so storm alerts can reach you.');
        return;
      }
      if (!location) {
        setError('Set your location so we know where to send storm alerts.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
          await saveSubscriber(credential.user.uid, email.trim(), phone.trim(), location!);
        } catch {
          // account creation already succeeded; the subscriber record just won't sync yet
        }
      }
    } catch (err) {
      setError(friendlyAuthError(err as AuthError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-bg">
      <div className="auth-screen">
        <div className="auth-card">
          <img src={logo} alt="" className="auth-logo" />
          <h1>Will's Severe Weather Alerts</h1>
          <p className="app-tagline">Fast. Trusted. Local.</p>
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

            {mode === 'signup' && (
              <>
                <label className="field">
                  <span>Phone number</span>
                  <input
                    type="tel"
                    required
                    placeholder="(555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </label>

                <div className="field">
                  <span>Your location</span>
                  {locationStatus === 'detecting' && (
                    <p className="signup-location-status">Detecting your location…</p>
                  )}
                  {locationStatus === 'detected' && location && (
                    <div className="signup-location-detected">
                      <MapPinIcon size={15} />
                      <span>
                        {location.name}
                        {location.admin1 ? `, ${location.admin1}` : ''}
                      </span>
                      <button type="button" onClick={() => setLocationStatus('manual')}>
                        Change
                      </button>
                    </div>
                  )}
                  {locationStatus === 'manual' && (
                    <div className="signup-location-manual">
                      {locationError && <p className="signup-location-status">{locationError}</p>}
                      <input
                        type="text"
                        placeholder="Search your city"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                      />
                      {searchingLocation && <p className="signup-location-status">Searching…</p>}
                      {locationResults.length > 0 && (
                        <ul className="location-results signup-location-results">
                          {locationResults.map((loc) => (
                            <li key={loc.id}>
                              <button type="button" onClick={() => selectManualLocation(loc)}>
                                <span className="location-name">{loc.name}</span>
                                <span className="location-meta">
                                  {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

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

          {DISCORD_INVITE_URL && (
            <div className="auth-discord">
              <span>Don't want to make an account?</span>
              <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer" className="auth-discord-link">
                <DiscordIcon size={16} />
                Join our Discord for storm alerts
              </a>
            </div>
          )}
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
