import { useState } from 'react';
import type { Location } from '../types';
import PushNotificationToggle from './PushNotificationToggle';
import {
  ChevronDownIcon,
  UserIcon,
  BellAlertIcon,
  AlertTriangleIcon,
  MapPinIcon,
  UsersIcon,
  MoonIcon,
  InfoIcon,
  LogoutIcon,
} from './icons';

interface Props {
  uid: string;
  email: string;
  notifyRain: boolean;
  notifySupported: boolean;
  onEnableRainNotify: () => void;
  onOpenSubscriptions: () => void;
  onLogout: () => void;
  onBack: () => void;
  locations: Location[];
  mutedLocationIds: string[];
  alertTypePrefs: Record<string, boolean>;
}

const APP_URL = 'https://williamwilson25.github.io/Will-s-Sevevre-Weather-Alerts/';

export default function SettingsScreen({
  uid,
  email,
  notifyRain,
  notifySupported,
  onEnableRainNotify,
  onOpenSubscriptions,
  onLogout,
  onBack,
  locations,
  mutedLocationIds,
  alertTypePrefs,
}: Props) {
  const [shareStatus, setShareStatus] = useState('');
  const [aboutOpen, setAboutOpen] = useState(false);

  async function handleInvite() {
    const shareData = {
      title: "Will's Severe Weather Alerts",
      text: 'Get free severe weather alerts for your area.',
      url: APP_URL,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled the share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(APP_URL);
      setShareStatus('Link copied!');
      setTimeout(() => setShareStatus(''), 2000);
    } catch {
      setShareStatus(APP_URL);
    }
  }

  return (
    <div className="settings-view">
      <header className="subscreen-header">
        <button type="button" className="subscreen-back" onClick={onBack} aria-label="Back">
          <ChevronDownIcon size={18} className="subscreen-back-chevron" />
        </button>
        <h1>Settings</h1>
      </header>

      <section className="settings-card">
        <ul className="settings-list">
          <li className="settings-row settings-row-static">
            <UserIcon size={18} className="settings-row-icon" />
            <span className="settings-row-label">{email}</span>
          </li>

          <li>
            <button type="button" className="settings-row" onClick={onEnableRainNotify}>
              <BellAlertIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">Rain Start Alerts</span>
              <span className="settings-row-value">
                {!notifySupported ? 'Unsupported' : notifyRain ? 'On' : 'Off'}
              </span>
              <ChevronDownIcon size={14} className="settings-row-chevron" />
            </button>
          </li>

          <li>
            <PushNotificationToggle
              uid={uid}
              locations={locations}
              mutedLocationIds={mutedLocationIds}
              alertTypePrefs={alertTypePrefs}
            />
          </li>

          <li>
            <button type="button" className="settings-row" onClick={onOpenSubscriptions}>
              <AlertTriangleIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">Alert Preferences</span>
              <ChevronDownIcon size={14} className="settings-row-chevron" />
            </button>
          </li>

          <li>
            <button type="button" className="settings-row" onClick={onOpenSubscriptions}>
              <MapPinIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">Manage Counties</span>
              <ChevronDownIcon size={14} className="settings-row-chevron" />
            </button>
          </li>

          <li>
            <button type="button" className="settings-row" onClick={handleInvite}>
              <UsersIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">Invite Friends</span>
              <span className="settings-row-value">{shareStatus}</span>
              <ChevronDownIcon size={14} className="settings-row-chevron" />
            </button>
          </li>

          <li className="settings-row settings-row-static">
            <MoonIcon size={18} className="settings-row-icon" />
            <span className="settings-row-label">App Theme</span>
            <span className="settings-row-value">Dark</span>
          </li>

          <li>
            <button type="button" className="settings-row" onClick={() => setAboutOpen((v) => !v)}>
              <InfoIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">About</span>
              <ChevronDownIcon
                size={14}
                className={`settings-row-chevron${aboutOpen ? ' settings-row-chevron-open' : ''}`}
              />
            </button>
          </li>
          {aboutOpen && (
            <li className="settings-about-body">
              <p>
                Will's Severe Weather Alerts is an independent local project, not an official
                National Weather Service product — always follow official NWS warnings and local
                emergency guidance during severe weather.
              </p>
              <p>
                Forecast &amp; current conditions: National Weather Service · Radar: NWS · Outlook:
                NOAA Storm Prediction Center.
              </p>
            </li>
          )}

          <li>
            <button type="button" className="settings-row settings-row-danger" onClick={onLogout}>
              <LogoutIcon size={18} className="settings-row-icon" />
              <span className="settings-row-label">Logout</span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}
