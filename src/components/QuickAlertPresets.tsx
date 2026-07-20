import type { CSSProperties } from 'react';
import type { AlertSeverity } from '../types';
import { SEVERITY_COLOR } from '../utils/alerts';
import {
  TornadoIcon,
  CloudLightningIcon,
  WaveIcon,
  WindIcon,
  AlertTriangleIcon,
  ThermometerIcon,
} from './icons';

export interface AlertPreset {
  label: string;
  severity: AlertSeverity;
  note: string;
}

const PRESETS: (AlertPreset & { icon: typeof TornadoIcon })[] = [
  {
    label: 'Tornado Warning',
    severity: 'emergency',
    note: 'Tornado Warning issued. Take shelter immediately in a basement or interior room away from windows.',
    icon: TornadoIcon,
  },
  {
    label: 'Tornado Watch',
    severity: 'watch',
    note: 'Tornado Watch in effect. Conditions are favorable for tornadoes to develop — stay alert.',
    icon: TornadoIcon,
  },
  {
    label: 'Severe T-Storm Warning',
    severity: 'warning',
    note: 'Severe Thunderstorm Warning issued. Damaging winds and large hail possible.',
    icon: CloudLightningIcon,
  },
  {
    label: 'Severe T-Storm Watch',
    severity: 'watch',
    note: 'Severe Thunderstorm Watch in effect. Conditions are favorable for severe storms.',
    icon: CloudLightningIcon,
  },
  {
    label: 'Flash Flood Warning',
    severity: 'emergency',
    note: 'Flash Flood Warning issued. Move to higher ground immediately — do not drive through flooded roads.',
    icon: WaveIcon,
  },
  {
    label: 'High Wind Warning',
    severity: 'warning',
    note: 'High Wind Warning issued. Expect damaging winds — secure loose outdoor objects.',
    icon: WindIcon,
  },
  {
    label: 'Heat Advisory',
    severity: 'advisory',
    note: 'Heat Advisory in effect. Limit outdoor activity, stay hydrated, and check on family/neighbors without AC.',
    icon: ThermometerIcon,
  },
  {
    label: 'Extreme Heat Warning',
    severity: 'warning',
    note: 'Extreme Heat Warning issued. Avoid outdoor activity during peak hours, stay hydrated, and never leave kids or pets in a car.',
    icon: ThermometerIcon,
  },
  {
    label: '🚨⚠️Stay Weather Aware ⚠️🚨',
    severity: 'advisory',
    note: '',
    icon: AlertTriangleIcon,
  },
];

interface Props {
  onSelect: (preset: AlertPreset) => void;
}

export default function QuickAlertPresets({ onSelect }: Props) {
  return (
    <div className="quick-alerts">
      <div className="quick-alerts-label">Quick alerts</div>
      <div className="quick-alerts-grid">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.label}
              type="button"
              className="quick-alert-button"
              style={{ '--severity-color': SEVERITY_COLOR[preset.severity] } as CSSProperties}
              onClick={() => onSelect(preset)}
            >
              <Icon size={18} />
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
