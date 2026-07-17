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
import RainNowcast from './components/RainNowcast';
import EnableNotificationsBanner from './components/EnableNotificationsBanner';
import type { NowcastState } from './utils/nowcast';
import { showNotification } from './utils/notify';
import { watchSubscribers } from './api/subscribers';
import FriendsManager from './components/FriendsManager';
import DiscordSettings from './components/DiscordSettings';
import AlertComposer from './components/AlertComposer';
import AlertHistory from './components/AlertHistory';
import AlertStats from './components/AlertStats';
import LoadingSkeleton from './components/LoadingSkeleton';
import ExternalRadar from './components/ExternalRadar';
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
  const isOwner = user?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const [locations, setLocations] = useLocalStorage<Location[]>('sw_locations', [DEFAULT_LOCATION]);
  const [activeLocationId, setActiveLocationId] = useLocalStorage<string>(
    'sw_active_location',
    DEFAULT_LOCATION.id,
  );
  const [friends, setFriends] = useLocalStorage<Friend[]>('sw_friends', []);
  const [history, setHistory] = useLocalStorage<AlertRecord[]>('sw_alert_history', []);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useLocalStorage<string>('sw_discord_webhook', '');
  const [notifyRain, setNotifyRain] = useLocalStorage<boolean>('sw_notify_rain', false);
  const [lastNotifiedKey, setLastNotifiedKey] = useLocalStorage<string>('sw_last_rain_notify', '');
  const [notifyPromptDismissed, setNotifyPromptDismissed] = useLocalStorage<boolean>(
    'sw_notify_prompt_dismissed',
    false,
  );
  const [notifyDenied, setNotifyDenied] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'denied',
  );

  const [nowcastSummary, setNowcastSummary] = useState<NowcastState | null>(null);
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

  useEffect(() => {
    if (!isOwner) return;
    const unsubscribe = watchSubscribers((subscribers) => {
      setFriends((prev) => {
        const knownUids = new Set(prev.map((f) => f.uid).filter(Boolean));
        const additions: Friend[] = subscribers
          .filter((s) => !knownUids.has(s.uid))
          .map((s) => ({
            id: crypto.randomUUID(),
            uid: s.uid,
            name: s.email.split('@')[0],
            phone: s.phone,
            location: s.location,
          }));
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

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
  const notifySupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (!nowcastSummary || !notifyRain) return;
    if (!notifySupported || Notification.permission !== 'granted') return;

    if (nowcastSummary.kind === 'clear') {
      // rain has passed (or never came) — clear so the next rain event notifies again
      if (lastNotifiedKey.startsWith(`${location.id}:`)) setLastNotifiedKey('');
      return;
    }

    const key = `${location.id}:${nowcastSummary.kind}`;
    if (key === lastNotifiedKey) return;

    if (nowcastSummary.kind === 'raining') {
      showNotification('Rain is starting', {
        body: `Rain is happening now in ${location.name}.`,
        icon: logo,
      });
    } else {
      showNotification('Rain expected soon', {
        body: `Rain is expected to start in about ${nowcastSummary.minutesAway} min in ${location.name}.`,
        icon: logo,
      });
    }
    setLastNotifiedKey(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowcastSummary, notifyRain, location.id]);

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

  function handleTestNotify() {
    showNotification('Test alert', {
      body: `This is what a rain alert will look like for ${location.name}.`,
      icon: logo,
    });
  }

  function handleQuickAlert() {
    if (worstRisk) handleAlertDay(worstRisk);
  }

  const isNight = snapshot ? !snapshot.current.isDay : false;

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
    <div
      className={`app-bg${isNight ? ' app-bg-night' : ''}`}
      style={{ backgroundImage: `url(${background})` }}
    >
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
            <CurrentConditions
              snapshot={snapshot}
              refreshing={refreshing}
              onRefresh={handleManualRefresh}
              notifyRain={notifyRain}
              notifySupported={notifySupported}
              notifyDenied={notifyDenied}
              onEnableNotify={handleEnableRainNotify}
              onTestNotify={handleTestNotify}
            />

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
                  {notifySupported && !notifyDenied && !notifyRain && !notifyPromptDismissed && (
                    <EnableNotificationsBanner
                      onEnable={handleEnableRainNotify}
                      onDismiss={() => setNotifyPromptDismissed(true)}
                    />
                  )}
                  <RainNowcast
                    location={snapshot.location}
                    hourly={snapshot.hourly}
                    onSummary={setNowcastSummary}
                  />
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
                  <ExternalRadar
                    url="https://www.news9.com/nextgen-live-radar"
                    label="LIVE"
                    title="Live storm radar"
                  />
                </div>
              )}

              {tab === 'outlook' && (
                <div className="outlook-view">
                  <StormOutlookMap location={snapshot.location} daily={snapshot.daily} />
                </div>
              )}

              {tab === 'alerts' && isOwner && (
                <div className="alerts-view">
                  <AlertStats history={history} friends={friends} />
                  <FriendsManager friends={friends} onChange={setFriends} onViewLocation={handleAddLocation} />
                  <DiscordSettings webhookUrl={discordWebhookUrl} onChange={setDiscordWebhookUrl} />
                  <AlertComposer
                    locationName={`${snapshot.location.name}${
                      snapshot.location.admin1 ? `, ${snapshot.location.admin1}` : ''
                    }`}
                    daily={snapshot.daily}
                    friends={friends}
                    selectedDate={alertDay?.date ?? null}
                    discordWebhookUrl={discordWebhookUrl}
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
