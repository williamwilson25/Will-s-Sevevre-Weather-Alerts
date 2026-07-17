import { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import type { AlertRecord, DailyForecast, Friend, Location, WeatherSnapshot } from './types';
import { fetchWeather } from './api/weather';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { auth, OWNER_EMAIL } from './firebase';
import SignIn from './components/SignIn';
import LocationSearch from './components/LocationSearch';
import LocationChips from './components/LocationChips';
import CurrentConditions from './components/CurrentConditions';
import HourlyStrip from './components/HourlyStrip';
import DailyForecastList from './components/DailyForecastList';
import SevereWeatherBanner from './components/SevereWeatherBanner';
import RainSoonBanner from './components/RainSoonBanner';
import { detectRainOnset } from './utils/rainOnset';
import FriendsManager from './components/FriendsManager';
import AlertComposer from './components/AlertComposer';
import AlertHistory from './components/AlertHistory';
import LoadingSkeleton from './components/LoadingSkeleton';
import RadarMap from './components/RadarMap';
import StormOutlookMap from './components/StormOutlookMap';
import { AlertTriangleIcon, BellAlertIcon } from './components/icons';
import logo from './assets/logo.png';
import background from './assets/background.jpg';

const DEFAULT_LOCATION: Location = {
  id: '4671654',
  name: 'Austin',
  admin1: 'Texas',
  country: 'United States',
  latitude: 30.26715,
  longitude: -97.74306,
  timezone: 'America/Chicago',
};

type Tab = 'forecast' | 'radar' | 'outlook' | 'alerts';

function getWorstRiskDay(snapshot: WeatherSnapshot | null): DailyForecast | null {
  if (!snapshot || snapshot.daily.length === 0) return null;
  return snapshot.daily.reduce((worst, day) => (day.risk.score > worst.risk.score ? day : worst));
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [locations, setLocations] = useLocalStorage<Location[]>('sw_locations', [DEFAULT_LOCATION]);
  const [activeLocationId, setActiveLocationId] = useLocalStorage<string>(
    'sw_active_location',
    DEFAULT_LOCATION.id,
  );
  const [friends, setFriends] = useLocalStorage<Friend[]>('sw_friends', []);
  const [history, setHistory] = useLocalStorage<AlertRecord[]>('sw_alert_history', []);
  const [notifyRain, setNotifyRain] = useLocalStorage<boolean>('sw_notify_rain', false);
  const [lastNotifiedKey, setLastNotifiedKey] = useLocalStorage<string>('sw_last_rain_notify', '');
  const [dismissedOnsetKey, setDismissedOnsetKey] = useState<string | null>(null);
  const [notifyDenied, setNotifyDenied] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'denied',
  );

  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('forecast');
  const [alertDay, setAlertDay] = useState<DailyForecast | null>(null);

  const location = locations.find((l) => l.id === activeLocationId) ?? locations[0] ?? DEFAULT_LOCATION;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchWeather(location)
      .then((data) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load weather');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.id, user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function refresh() {
      setRefreshing(true);
      fetchWeather(location)
        .then((data) => {
          if (!cancelled) setSnapshot(data);
        })
        .catch(() => {
          // silent refresh — keep showing the last good snapshot on failure
        })
        .finally(() => {
          if (!cancelled) setRefreshing(false);
        });
    }

    const interval = setInterval(refresh, 5 * 60 * 1000);

    function handleVisibility() {
      if (document.visibilityState === 'visible') refresh();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [location.id, user]);

  function handleManualRefresh() {
    setRefreshing(true);
    fetchWeather(location)
      .then((data) => setSnapshot(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load weather'))
      .finally(() => setRefreshing(false));
  }

  function handleAddLocation(loc: Location) {
    if (!locations.some((l) => l.id === loc.id)) {
      setLocations([...locations, loc]);
    }
    setActiveLocationId(loc.id);
  }

  function handleSelectLocation(id: string) {
    setActiveLocationId(id);
  }

  function handleRemoveLocation(id: string) {
    const next = locations.filter((l) => l.id !== id);
    if (next.length === 0) return;
    setLocations(next);
    if (id === activeLocationId) setActiveLocationId(next[0].id);
  }

  function handleAlertDay(day: DailyForecast) {
    setAlertDay(day);
    setTab('alerts');
  }

  function handleSent(record: AlertRecord) {
    setHistory([record, ...history]);
  }

  const worstRisk = getWorstRiskDay(snapshot);
  const rainOnset = snapshot ? detectRainOnset(snapshot.hourly) : null;
  const onsetKey = rainOnset ? `${location.id}:${rainOnset.hour.time}` : null;
  const notifySupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (!onsetKey || !notifyRain || onsetKey === lastNotifiedKey) return;
    if (!notifySupported || Notification.permission !== 'granted' || !rainOnset) return;
    new Notification('Rain expected soon', {
      body: `${Math.round(rainOnset.hour.precipitationProbability)}% chance around ${new Date(
        rainOnset.hour.time,
      ).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} in ${location.name}`,
      icon: logo,
    });
    setLastNotifiedKey(onsetKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onsetKey, notifyRain]);

  function handleEnableRainNotify() {
    if (!notifySupported) return;
    if (Notification.permission === 'granted') {
      setNotifyRain(true);
      return;
    }
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') setNotifyRain(true);
      else if (perm === 'denied') setNotifyDenied(true);
    });
  }

  function handleQuickAlert() {
    if (worstRisk) handleAlertDay(worstRisk);
  }

  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  if (authLoading) {
    return (
      <div className="app-bg" style={{ backgroundImage: `url(${background})` }}>
        <div className="app">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="app-bg" style={{ backgroundImage: `url(${background})` }}>
      <div className="app">
        <header className="app-header">
          <div className="app-title">
            <img src={logo} alt="" className="app-logo" />
            <h1>Will's Severe Weather Alerts</h1>
          </div>
          <LocationSearch onSelect={handleAddLocation} />
        </header>

        <div className="auth-bar">
          <span className="auth-bar-email">{user.email}</span>
          <button type="button" className="auth-signout" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>

        <LocationChips
          locations={locations}
          activeId={location.id}
          onSelect={handleSelectLocation}
          onRemove={handleRemoveLocation}
        />

        {loading && <LoadingSkeleton />}
        {error && (
          <div className="status-panel status-error">
            <AlertTriangleIcon size={28} />
            <p>Couldn't load weather: {error}</p>
          </div>
        )}

        {!loading && !error && snapshot && (
          <>
            <CurrentConditions snapshot={snapshot} refreshing={refreshing} onRefresh={handleManualRefresh} />

            <nav className="tabs">
              <button className={tab === 'forecast' ? 'active' : ''} onClick={() => setTab('forecast')}>
                Forecast
              </button>
              <button className={tab === 'radar' ? 'active' : ''} onClick={() => setTab('radar')}>
                Radar
              </button>
              <button className={tab === 'outlook' ? 'active' : ''} onClick={() => setTab('outlook')}>
                Outlook
              </button>
              {isOwner && (
                <button className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}>
                  Alerts
                  {history.length > 0 && <span className="tab-count">{history.length}</span>}
                </button>
              )}
            </nav>

            <main>
              {tab === 'forecast' && (
                <div className="forecast-view">
                  {rainOnset && onsetKey !== dismissedOnsetKey && (
                    <RainSoonBanner
                      onset={rainOnset}
                      notifyEnabled={notifyRain}
                      notifySupported={notifySupported}
                      notifyDenied={notifyDenied}
                      onEnableNotify={handleEnableRainNotify}
                      onDismiss={() => setDismissedOnsetKey(onsetKey)}
                    />
                  )}
                  <SevereWeatherBanner
                    daily={snapshot.daily}
                    onAlertDay={isOwner ? handleAlertDay : undefined}
                  />
                  <HourlyStrip hourly={snapshot.hourly} />
                  <DailyForecastList
                    daily={snapshot.daily}
                    onAlertDay={isOwner ? handleAlertDay : undefined}
                  />
                </div>
              )}

              {tab === 'radar' && (
                <div className="radar-view">
                  <RadarMap location={snapshot.location} />
                </div>
              )}

              {tab === 'outlook' && (
                <div className="outlook-view">
                  <StormOutlookMap location={snapshot.location} daily={snapshot.daily} />
                </div>
              )}

              {tab === 'alerts' && isOwner && (
                <div className="alerts-view">
                  <FriendsManager friends={friends} onChange={setFriends} />
                  <AlertComposer
                    locationName={`${snapshot.location.name}${
                      snapshot.location.admin1 ? `, ${snapshot.location.admin1}` : ''
                    }`}
                    daily={snapshot.daily}
                    friends={friends}
                    selectedDate={alertDay?.date ?? null}
                    onSent={handleSent}
                  />
                  <AlertHistory history={history} friends={friends} onClear={() => setHistory([])} />
                </div>
              )}
            </main>

            {tab === 'forecast' && isOwner && worstRisk && (
              <button
                type="button"
                className={`fab fab-${worstRisk.risk.level}`}
                onClick={handleQuickAlert}
              >
                <BellAlertIcon size={17} />
                Alert friends
              </button>
            )}

            <footer className="app-footer">
              Weather data from Open-Meteo. Alerts are sent through your own Messages app — this
              app never stores your friends' data outside this browser.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
