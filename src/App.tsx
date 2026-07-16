import { useEffect, useState } from 'react';
import type { AlertRecord, DailyForecast, Friend, Location, WeatherSnapshot } from './types';
import { fetchWeather } from './api/weather';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_THEME, getWeatherTheme } from './utils/weatherTheme';
import LocationSearch from './components/LocationSearch';
import CurrentConditions from './components/CurrentConditions';
import HourlyStrip from './components/HourlyStrip';
import DailyForecastList from './components/DailyForecastList';
import SevereWeatherBanner from './components/SevereWeatherBanner';
import FriendsManager from './components/FriendsManager';
import AlertComposer from './components/AlertComposer';
import AlertHistory from './components/AlertHistory';

const DEFAULT_LOCATION: Location = {
  id: '4671654',
  name: 'Austin',
  admin1: 'Texas',
  country: 'United States',
  latitude: 30.26715,
  longitude: -97.74306,
  timezone: 'America/Chicago',
};

type Tab = 'forecast' | 'alerts';

function getWorstRiskDay(snapshot: WeatherSnapshot | null): DailyForecast | null {
  if (!snapshot || snapshot.daily.length === 0) return null;
  return snapshot.daily.reduce((worst, day) => (day.risk.score > worst.risk.score ? day : worst));
}

export default function App() {
  const [location, setLocation] = useLocalStorage<Location>('sw_location', DEFAULT_LOCATION);
  const [friends, setFriends] = useLocalStorage<Friend[]>('sw_friends', []);
  const [history, setHistory] = useLocalStorage<AlertRecord[]>('sw_alert_history', []);

  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('forecast');
  const [alertDay, setAlertDay] = useState<DailyForecast | null>(null);

  useEffect(() => {
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
  }, [location]);

  function handleAlertDay(day: DailyForecast) {
    setAlertDay(day);
    setTab('alerts');
  }

  function handleSent(record: AlertRecord) {
    setHistory([record, ...history]);
  }

  const theme = snapshot ? getWeatherTheme(snapshot.current.weatherCode, snapshot.current.isDay) : DEFAULT_THEME;
  const worstRisk = getWorstRiskDay(snapshot);

  function handleQuickAlert() {
    if (worstRisk) handleAlertDay(worstRisk);
  }

  return (
    <div className={`app-bg theme-${theme.key}`} style={{ background: theme.gradient }}>
      <div className="app">
        <header className="app-header">
          <div className="app-title">
            <span className="app-logo" aria-hidden="true">
              ⛈️
            </span>
            <h1>StormWatch</h1>
          </div>
          <LocationSearch onSelect={setLocation} />
        </header>

        {loading && <div className="status-panel">Loading weather for {location.name}…</div>}
        {error && <div className="status-panel status-error">Couldn't load weather: {error}</div>}

        {!loading && !error && snapshot && (
          <>
            <CurrentConditions snapshot={snapshot} />

            <nav className="tabs">
              <button className={tab === 'forecast' ? 'active' : ''} onClick={() => setTab('forecast')}>
                Forecast
              </button>
              <button className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}>
                Friends &amp; Alerts
                {history.length > 0 && <span className="tab-count">{history.length}</span>}
              </button>
            </nav>

            <main>
              {tab === 'forecast' && (
                <div className="forecast-view">
                  <SevereWeatherBanner daily={snapshot.daily} onAlertDay={handleAlertDay} />
                  <HourlyStrip hourly={snapshot.hourly} />
                  <DailyForecastList daily={snapshot.daily} onAlertDay={handleAlertDay} />
                </div>
              )}

              {tab === 'alerts' && (
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

            {tab === 'forecast' && worstRisk && (
              <button
                type="button"
                className={`fab fab-${worstRisk.risk.level}`}
                onClick={handleQuickAlert}
              >
                🚨 Alert friends
              </button>
            )}

            <footer className="app-footer">
              Weather data from Open-Meteo. Alerts are sent through your own email/SMS app —
              StormWatch never stores your friends' data outside this browser.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
