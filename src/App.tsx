import { useEffect, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
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
import StatusBar from './components/StatusBar';
import HourlyStrip from './components/HourlyStrip';
import SevereWeatherBanner from './components/SevereWeatherBanner';
import StormRiskMeter from './components/StormRiskMeter';
import TodaysOutlookRow from './components/TodaysOutlookRow';
import StormArrivalTimer from './components/StormArrivalTimer';
import SavedLocationsList from './components/SavedLocationsList';
import RainNowcast from './components/RainNowcast';
import ActiveAlerts from './components/ActiveAlerts';
import AlertNotificationSettings from './components/AlertNotificationSettings';
import NwsForecastCard from './components/NwsForecastCard';
import EnableNotificationsBanner from './components/EnableNotificationsBanner';
import type { NowcastState } from './utils/nowcast';
import { fetchActiveAlerts, type NwsAlert } from './api/nwsAlerts';
import { DEFAULT_ALERT_TYPE_PREFS, isAlertNotifiable } from './utils/alertTypes';
import { showNotification } from './utils/notify';
import { watchSubscribers } from './api/subscribers';
import FriendsManager from './components/FriendsManager';
import DiscordSettings from './components/DiscordSettings';
import AlertComposer from './components/AlertComposer';
import AlertHistory from './components/AlertHistory';
import AlertStats from './components/AlertStats';
import LoadingSkeleton from './components/LoadingSkeleton';
import ExternalRadar from './components/ExternalRadar';
import StormReportsTab from './components/StormReportsTab';
import WeatherDeskCard from './components/WeatherDeskCard';
import StormSafetyCard from './components/StormSafetyCard';
import MoreScreen from './components/MoreScreen';
import SettingsScreen from './components/SettingsScreen';
import SubscriptionsScreen from './components/SubscriptionsScreen';
import {
  AlertTriangleIcon,
  BellAlertIcon,
  HomeIcon,
  RadarIcon,
  DotsIcon,
  PlusIcon,
  ChevronDownIcon,
} from './components/icons';
import logo from './assets/logo.png';

const DEFAULT_LOCATION: Location = {
  id: '4671654',
  name: 'Austin',
  admin1: 'Texas',
  country: 'United States',
  latitude: 30.26715,
  longitude: -97.74306,
  timezone: 'America/Chicago',
};

type Tab =
  | 'forecast'
  | 'radar'
  | 'more'
  | 'outlook'
  | 'reports'
  | 'settings'
  | 'subscriptions'
  | 'alerts'
  | 'compose';

// Order controls both the swipeable tab-track and left/right swipe gestures.
// Only forecast/radar/more/alerts get their own bottom-nav button — the rest
// (outlook, reports, settings, subscriptions, compose) are reached via the
// More menu or the + button, but stay in this array so they're still real
// tab-panels with a back header rather than a separate modal/router.
const TAB_ORDER: Tab[] = [
  'forecast',
  'radar',
  'more',
  'outlook',
  'reports',
  'settings',
  'subscriptions',
  'alerts',
  'compose',
];

// Swipe gestures starting inside these shouldn't switch tabs — they need
// horizontal touch for their own scrolling/panning/dragging.
const SWIPE_EXEMPT_SELECTOR =
  '.hourly-scroll, .location-results, textarea, select';

function isSwipeExempt(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(SWIPE_EXEMPT_SELECTOR);
}

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
  const [alertTypePrefs, setAlertTypePrefs] = useLocalStorage<Record<string, boolean>>(
    'sw_notify_alert_types',
    DEFAULT_ALERT_TYPE_PREFS,
  );
  const [notifiedAlertIds, setNotifiedAlertIds] = useLocalStorage<string[]>('sw_notified_alert_ids', []);
  const [mutedLocationIds, setMutedLocationIds] = useLocalStorage<string[]>('sw_muted_locations', []);
  const [watchedAlerts, setWatchedAlerts] = useState<
    { alert: NwsAlert; locationName: string; locationId: string }[]
  >([]);

  const [nowcastSummary, setNowcastSummary] = useState<{
    summary: NowcastState;
    locationId: string;
  } | null>(null);
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('forecast');
  const [alertDay, setAlertDay] = useState<DailyForecast | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

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

  // Watches every saved location for active NWS alerts, not just the one
  // currently on screen — so a Tornado Warning for a saved-but-not-active
  // city still notifies (this is what covers "custom county alerts": add
  // any county's town via the location search and it's watched here).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    function poll() {
      Promise.all(
        locations.map((loc) =>
          fetchActiveAlerts(loc)
            .then((alerts) => alerts.map((alert) => ({ alert, locationName: loc.name, locationId: loc.id })))
            .catch(() => []),
        ),
      ).then((results) => {
        if (!cancelled) setWatchedAlerts(results.flat());
      });
    }

    poll();
    const interval = setInterval(poll, 2 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations.map((l) => l.id).join(','), user]);

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

  const visibleTabs = isOwner ? TAB_ORDER : TAB_ORDER.filter((t) => t !== 'alerts' && t !== 'compose');
  const activeIndex = visibleTabs.indexOf(tab);

  function goToTab(next: Tab) {
    setTab(next);
  }

  function handleTouchStart(e: TouchEvent) {
    if (isSwipeExempt(e.target)) {
      touchStart.current = null;
      return;
    }
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;

    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    const currentIndex = visibleTabs.indexOf(tab);
    if (dx < 0 && currentIndex < visibleTabs.length - 1) {
      goToTab(visibleTabs[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      goToTab(visibleTabs[currentIndex - 1]);
    }
  }

  function handleAlertDay(day: DailyForecast) {
    setAlertDay(day);
    goToTab('compose');
  }

  function handleSent(record: AlertRecord) {
    setHistory([record, ...history]);
  }

  const worstRisk = getWorstRiskDay(snapshot);
  const notifySupported = typeof window !== 'undefined' && 'Notification' in window;

  useEffect(() => {
    if (!nowcastSummary || !notifyRain) return;
    if (!notifySupported || Notification.permission !== 'granted') return;
    // Guard against stale data from a just-departed location: RainNowcast's
    // fetch for the new location is async, so this effect can still fire once
    // with a summary that belongs to the previous location.id.
    if (nowcastSummary.locationId !== location.id) return;

    const { summary } = nowcastSummary;

    if (summary.kind === 'clear') {
      // rain has passed (or never came) — clear so the next rain event notifies again
      if (lastNotifiedKey.startsWith(`${location.id}:`)) setLastNotifiedKey('');
      return;
    }

    const key = `${location.id}:${summary.kind}`;
    if (key === lastNotifiedKey) return;

    if (summary.kind === 'raining') {
      showNotification('Rain is starting', {
        body: `Rain is happening now in ${location.name}.`,
        icon: logo,
      });
    } else {
      showNotification('Rain expected soon', {
        body: `Rain is expected to start in about ${summary.minutesAway} min in ${location.name}.`,
        icon: logo,
      });
    }
    setLastNotifiedKey(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowcastSummary, notifyRain, location.id]);

  useEffect(() => {
    if (!notifySupported || Notification.permission !== 'granted') return;
    const fresh = watchedAlerts.filter(
      ({ alert, locationId }) =>
        !notifiedAlertIds.includes(alert.id) &&
        !mutedLocationIds.includes(locationId) &&
        isAlertNotifiable(alert, alertTypePrefs),
    );
    if (fresh.length === 0) return;

    fresh.forEach(({ alert, locationName }) => {
      showNotification(alert.event, {
        body: `${alert.headline || alert.description.slice(0, 120)} — ${locationName}`,
        icon: logo,
      });
    });

    // Keep the dedup list from growing forever — NWS alert IDs are unique per
    // issuance, so old ones are safe to drop once expired alerts scroll off.
    const updated = [...notifiedAlertIds, ...fresh.map(({ alert }) => alert.id)].slice(-200);
    setNotifiedAlertIds(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAlerts, alertTypePrefs, mutedLocationIds]);

  function handleAlertTypeChange(key: string, enabled: boolean) {
    setAlertTypePrefs({ ...alertTypePrefs, [key]: enabled });
  }

  function handleToggleLocationMuted(id: string, muted: boolean) {
    setMutedLocationIds(muted ? [...mutedLocationIds, id] : mutedLocationIds.filter((x) => x !== id));
  }

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
      <div className="app-bg">
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
    <div className={`app-bg${isNight ? ' app-bg-night' : ''}`}>
      <div className="app">
        <header className="app-header">
          <div className="app-title">
            <img src={logo} alt="" className="app-logo" />
            <div>
              <h1>Will's Severe Weather Alerts</h1>
              <p className="app-tagline">Fast. Trusted. Local.</p>
            </div>
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
            <StatusBar snapshot={snapshot} refreshing={refreshing} onRefresh={handleManualRefresh} />

            <div className="tab-pager" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div
                className="tab-track"
                style={{
                  width: `${visibleTabs.length * 100}%`,
                  transform: `translateX(-${(activeIndex / visibleTabs.length) * 100}%)`,
                }}
              >
                {visibleTabs.map((t) => (
                  <div
                    key={t}
                    className="tab-panel"
                    style={{ width: `${100 / visibleTabs.length}%` }}
                    aria-hidden={t !== tab}
                  >
                    {t === 'forecast' && (
                      <div className="forecast-view">
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
                        {snapshot.daily[0] && (
                          <TodaysOutlookRow
                            risk={snapshot.daily[0].risk}
                            onViewOutlook={() => goToTab('outlook')}
                          />
                        )}
                        {snapshot.daily[0] && <StormRiskMeter risk={snapshot.daily[0].risk} />}
                        <ActiveAlerts location={snapshot.location} />
                        {nowcastSummary &&
                          nowcastSummary.locationId === location.id &&
                          nowcastSummary.summary.kind === 'starting' && (
                            <StormArrivalTimer minutesAway={nowcastSummary.summary.minutesAway} />
                          )}
                        {notifySupported && !notifyDenied && !notifyRain && !notifyPromptDismissed && (
                          <EnableNotificationsBanner
                            onEnable={handleEnableRainNotify}
                            onDismiss={() => setNotifyPromptDismissed(true)}
                          />
                        )}
                        <RainNowcast
                          location={snapshot.location}
                          hourly={snapshot.hourly}
                          onSummary={(summary, locationId) => setNowcastSummary({ summary, locationId })}
                        />
                        <SevereWeatherBanner
                          daily={snapshot.daily}
                          onAlertDay={isOwner ? handleAlertDay : undefined}
                        />
                        <HourlyStrip hourly={snapshot.hourly} />
                        <SavedLocationsList
                          locations={locations}
                          activeId={location.id}
                          activeConditions={snapshot.current}
                          onSelect={handleSelectLocation}
                        />
                        <WeatherDeskCard isOwner={isOwner} />
                        <AlertNotificationSettings prefs={alertTypePrefs} onChange={handleAlertTypeChange} />
                        <NwsForecastCard location={snapshot.location} />
                        <StormSafetyCard />
                        <footer className="app-footer">
                          <p>
                            Forecast &amp; current conditions: National Weather Service · Radar: NWS ·
                            Outlook: NOAA Storm Prediction Center.
                          </p>
                          <p>
                            Will's Severe Weather Alerts is an independent local project, not an
                            official National Weather Service product — always follow official NWS
                            warnings and local emergency guidance during severe weather.
                          </p>
                          <p>
                            Alerts are sent through your own Messages app; friend data never leaves
                            this browser.
                          </p>
                        </footer>
                      </div>
                    )}

                    {t === 'radar' && (
                      <div className="radar-view">
                        <ExternalRadar
                          url="https://radar.weather.gov/station/KTLX/standard"
                          title="Live Storm Radar"
                          label="LIVE"
                          caption="Live radar from the National Weather Service — Norman, OK (KTLX)."
                        />
                      </div>
                    )}

                    {t === 'more' && (
                      <MoreScreen
                        onOpenOutlook={() => goToTab('outlook')}
                        onOpenReports={() => goToTab('reports')}
                        onOpenSubscriptions={() => goToTab('subscriptions')}
                        onOpenSettings={() => goToTab('settings')}
                      />
                    )}

                    {t === 'outlook' && (
                      <div className="outlook-view">
                        <header className="subscreen-header">
                          <button
                            type="button"
                            className="subscreen-back"
                            onClick={() => goToTab('more')}
                            aria-label="Back"
                          >
                            <ChevronDownIcon size={18} className="subscreen-back-chevron" />
                          </button>
                          <h1>Storm Outlook</h1>
                        </header>
                        <ExternalRadar
                          url="https://www.spc.noaa.gov/products/outlook/"
                          title="Storm Outlook"
                          label="SPC"
                          caption="Day 1–3 convective outlooks from NOAA's Storm Prediction Center."
                        />
                      </div>
                    )}

                    {t === 'reports' && user && (
                      <div className="reports-view">
                        <header className="subscreen-header">
                          <button
                            type="button"
                            className="subscreen-back"
                            onClick={() => goToTab('more')}
                            aria-label="Back"
                          >
                            <ChevronDownIcon size={18} className="subscreen-back-chevron" />
                          </button>
                          <h1>Storm Reports</h1>
                        </header>
                        <StormReportsTab
                          uid={user.uid}
                          email={user.email ?? ''}
                          locationName={`${snapshot.location.name}${
                            snapshot.location.admin1 ? `, ${snapshot.location.admin1}` : ''
                          }`}
                          isOwner={isOwner}
                        />
                      </div>
                    )}

                    {t === 'settings' && (
                      <SettingsScreen
                        email={user.email ?? ''}
                        notifyRain={notifyRain}
                        notifySupported={notifySupported}
                        onEnableRainNotify={handleEnableRainNotify}
                        onOpenSubscriptions={() => goToTab('subscriptions')}
                        onLogout={() => signOut(auth)}
                        onBack={() => goToTab('more')}
                      />
                    )}

                    {t === 'subscriptions' && (
                      <SubscriptionsScreen
                        locations={locations}
                        mutedLocationIds={mutedLocationIds}
                        onToggleMuted={handleToggleLocationMuted}
                        onAddLocation={handleAddLocation}
                        onRemoveLocation={handleRemoveLocation}
                        alertTypePrefs={alertTypePrefs}
                        onAlertTypeChange={handleAlertTypeChange}
                        onBack={() => goToTab('more')}
                      />
                    )}

                    {t === 'alerts' && isOwner && (
                      <div className="alerts-view">
                        <AlertStats history={history} friends={friends} />
                        <FriendsManager
                          friends={friends}
                          onChange={setFriends}
                          onViewLocation={handleAddLocation}
                        />
                        <DiscordSettings webhookUrl={discordWebhookUrl} onChange={setDiscordWebhookUrl} />
                        <AlertHistory history={history} friends={friends} onClear={() => setHistory([])} />
                      </div>
                    )}

                    {t === 'compose' && isOwner && (
                      <div className="compose-view">
                        <header className="subscreen-header compose-header">
                          <button type="button" className="compose-cancel" onClick={() => goToTab('forecast')}>
                            Cancel
                          </button>
                          <h1>Create Alert</h1>
                          <a href="#compose-preview" className="compose-preview-link">
                            Preview
                          </a>
                        </header>
                        <AlertComposer
                          locationName={`${snapshot.location.name}${
                            snapshot.location.admin1 ? `, ${snapshot.location.admin1}` : ''
                          }`}
                          daily={snapshot.daily}
                          friends={friends}
                          selectedDate={alertDay?.date ?? null}
                          discordWebhookUrl={discordWebhookUrl}
                          onSent={(record) => {
                            handleSent(record);
                            goToTab('alerts');
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

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

            <nav className={`bottom-nav${isOwner ? ' bottom-nav-with-compose' : ''}`}>
              <button
                className={tab === 'forecast' ? 'active' : ''}
                onClick={() => goToTab('forecast')}
              >
                <HomeIcon size={21} />
                Dashboard
              </button>
              {isOwner && (
                <button
                  className={tab === 'alerts' ? 'active' : ''}
                  onClick={() => goToTab('alerts')}
                >
                  <span className="bottom-nav-icon-wrap">
                    <BellAlertIcon size={21} />
                    {history.length > 0 && <span className="tab-count">{history.length}</span>}
                  </span>
                  Alerts
                </button>
              )}
              {isOwner && (
                <button
                  className={`bottom-nav-compose${tab === 'compose' ? ' active' : ''}`}
                  onClick={() => goToTab('compose')}
                  aria-label="Create alert"
                >
                  <span className="bottom-nav-compose-circle">
                    <PlusIcon size={22} />
                  </span>
                </button>
              )}
              <button className={tab === 'radar' ? 'active' : ''} onClick={() => goToTab('radar')}>
                <RadarIcon size={21} />
                Radar
              </button>
              <button
                className={['more', 'outlook', 'reports', 'settings', 'subscriptions'].includes(tab) ? 'active' : ''}
                onClick={() => goToTab('more')}
              >
                <DotsIcon size={21} />
                More
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}
