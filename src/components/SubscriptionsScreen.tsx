import type { Location } from '../types';
import LocationSearch from './LocationSearch';
import AlertNotificationSettings from './AlertNotificationSettings';
import ToggleSwitch from './ToggleSwitch';
import { MapPinIcon, ChevronDownIcon } from './icons';

interface Props {
  locations: Location[];
  mutedLocationIds: string[];
  onToggleMuted: (id: string, muted: boolean) => void;
  onAddLocation: (location: Location) => void;
  onRemoveLocation: (id: string) => void;
  alertTypePrefs: Record<string, boolean>;
  onAlertTypeChange: (key: string, enabled: boolean) => void;
  onBack: () => void;
}

export default function SubscriptionsScreen({
  locations,
  mutedLocationIds,
  onToggleMuted,
  onAddLocation,
  onRemoveLocation,
  alertTypePrefs,
  onAlertTypeChange,
  onBack,
}: Props) {
  return (
    <div className="subscriptions-view">
      <header className="subscreen-header">
        <button type="button" className="subscreen-back" onClick={onBack} aria-label="Back">
          <ChevronDownIcon size={18} className="subscreen-back-chevron" />
        </button>
        <h1>My Subscriptions</h1>
      </header>

      <section className="my-counties-card">
        <h2>My Counties</h2>
        <p className="discord-subtitle">You'll receive alerts for these locations.</p>
        <ul className="my-counties-list">
          {locations.map((loc) => {
            const muted = mutedLocationIds.includes(loc.id);
            return (
              <li key={loc.id} className="my-county-row">
                <span className="my-county-name">
                  <MapPinIcon size={13} />
                  {loc.name}
                  {loc.admin1 ? `, ${loc.admin1}` : ''}
                </span>
                <span className="my-county-actions">
                  <ToggleSwitch
                    label={`Alerts for ${loc.name}`}
                    checked={!muted}
                    onChange={(checked) => onToggleMuted(loc.id, !checked)}
                  />
                  {locations.length > 1 && (
                    <button
                      type="button"
                      className="my-county-remove"
                      onClick={() => onRemoveLocation(loc.id)}
                      aria-label={`Remove ${loc.name}`}
                    >
                      Remove
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="my-counties-add">
          <LocationSearch onSelect={onAddLocation} />
        </div>
      </section>

      <AlertNotificationSettings prefs={alertTypePrefs} onChange={onAlertTypeChange} />
    </div>
  );
}
