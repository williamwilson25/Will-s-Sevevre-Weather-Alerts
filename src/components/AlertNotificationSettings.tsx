import { ALERT_TYPE_CONFIGS } from '../utils/alertTypes';
import ToggleSwitch from './ToggleSwitch';
import {
  TornadoIcon,
  CloudLightningIcon,
  WaveIcon,
  WindIcon,
  CloudSnowIcon,
  AlertTriangleIcon,
} from './icons';

const ICONS: Record<string, typeof TornadoIcon> = {
  tornado_warning: TornadoIcon,
  tornado_watch: TornadoIcon,
  severe_tstorm_warning: CloudLightningIcon,
  severe_tstorm_watch: CloudLightningIcon,
  flash_flood_warning: WaveIcon,
  high_wind_warning: WindIcon,
  winter_weather: CloudSnowIcon,
  other_warnings: AlertTriangleIcon,
};

interface Props {
  prefs: Record<string, boolean>;
  onChange: (key: string, enabled: boolean) => void;
}

export default function AlertNotificationSettings({ prefs, onChange }: Props) {
  return (
    <section className="alert-type-settings">
      <h2>Notifications</h2>
      <p className="discord-subtitle">
        Choose which official NWS alert types push a notification. Checked across every saved
        location, not just the one you're viewing — add more from the search bar above to watch
        additional counties or towns.
      </p>
      <div className="alert-type-settings-list">
        {ALERT_TYPE_CONFIGS.map((config) => {
          const Icon = ICONS[config.key];
          return (
            <div className="alert-type-row" key={config.key}>
              <Icon size={18} className="alert-type-icon" />
              <span className="alert-type-label">{config.label}</span>
              <ToggleSwitch
                label={config.label}
                checked={prefs[config.key] ?? config.defaultEnabled}
                onChange={(checked) => onChange(config.key, checked)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
