interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const;
}

export function TornadoIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M3.5 4h17M5 8h14M6.5 12h11M8 16h8M9.5 20h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WaveIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M2.5 9.5c1.4-1.6 2.8-1.6 4.2 0s2.8 1.6 4.2 0 2.8-1.6 4.2 0 2.8 1.6 4.2 0 2.8-1.6 2.2-1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2.5 15.5c1.4-1.6 2.8-1.6 4.2 0s2.8 1.6 4.2 0 2.8-1.6 4.2 0 2.8 1.6 4.2 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M5.5 9l6.5 6.5L18.5 9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function SunIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M12 2.6v2.6M12 18.8v2.6M4.6 4.6l1.85 1.85M17.55 17.55l1.85 1.85M2.6 12h2.6M18.8 12h2.6M4.6 19.4l1.85-1.85M17.55 6.45l1.85-1.85" />
      </g>
    </svg>
  );
}

export function MoonIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M19 14.5A8 8 0 1 1 9.5 5a6.4 6.4 0 0 0 9.5 9.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloudBase({ opacity = 1 }: { opacity?: number }) {
  return (
    <path
      d="M7 17a4 4 0 0 1-.7-7.94A5.3 5.3 0 0 1 16.7 7.4 3.9 3.9 0 0 1 16.2 17H7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}

export function CloudIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <CloudBase />
    </svg>
  );
}

export function CloudSunIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="8" cy="7.6" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6">
        <path d="M8 2.6v1.6M2.6 7.6h1.6M4.2 4.2l1.1 1.1M12.8 4.2l-1.1 1.1" />
      </g>
      <CloudBase />
    </svg>
  );
}

export function CloudMoonIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M13 7.6a4.3 4.3 0 0 1-4.8-5.4A6 6 0 1 0 13 7.6z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <CloudBase />
    </svg>
  );
}

export function CloudsIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M4 13.6a3.1 3.1 0 0 1 .5-6.15A4.1 4.1 0 0 1 12.5 6a2.9 2.9 0 0 1 2 5.2 2.7 2.7 0 0 1-.6 4.8H5a2.6 2.6 0 0 1-1-2.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.65"
      />
      <CloudBase />
    </svg>
  );
}

export function CloudRainIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <CloudBase />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8.3 18.3l-1.1 2.2M12.5 18.3l-1.1 2.2M16.7 18.3l-1.1 2.2" />
      </g>
    </svg>
  );
}

export function CloudLightningIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <CloudBase />
      <path
        d="M13 14.5 10 19h2.5l-1.3 4.4 4.8-6h-2.6l1.3-2.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloudSnowIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <CloudBase />
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <path d="M8.3 18v3M6.9 19.5h2.8M12.5 18v3M11.1 19.5h2.8M16.7 18v3M15.3 19.5h2.8" />
      </g>
    </svg>
  );
}

export function CloudFogIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M7 13.6a3.6 3.6 0 0 1-.4-7.14A4.8 4.8 0 0 1 16 7.4a3.5 3.5 0 0 1-.45 6.2H7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4.5 17.2h15M6 20.2h12" />
      </g>
    </svg>
  );
}

export function AlertTriangleIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M12 3.4 22 20.6H2z"
        fill="currentColor"
        opacity="0.16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 9.5v5.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17.6" r="1.05" fill="currentColor" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.16" />
      <path
        d="m8 12.4 2.6 2.6L16.2 9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BellAlertIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M12 3a5.2 5.2 0 0 0-5.2 5.2v2.9c0 .7-.25 1.38-.7 1.92L4.7 14.7c-.6.72-.1 1.8.84 1.8h13c.93 0 1.43-1.08.84-1.8l-1.4-1.68a2.98 2.98 0 0 1-.7-1.92V8.2A5.2 5.2 0 0 0 12 3z"
        fill="currentColor"
      />
      <path d="M9.6 19a2.5 2.5 0 0 0 4.8 0z" fill="currentColor" />
    </svg>
  );
}

export function MapPinIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function DropletIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M12 3.3s5.6 6.3 5.6 10.3a5.6 5.6 0 1 1-11.2 0C6.4 9.6 12 3.3 12 3.3z"
        fill="currentColor"
      />
    </svg>
  );
}

export function WindIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 12h14.5a2.75 2.75 0 1 1-2.75 2.75"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 16h9a2 2 0 1 1-2 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function GaugeIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 16a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M12 16l4-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function EyeIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

export function SunriseIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 17a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M2 17h20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M9 14.5l3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M5.5 10.5l1.3 1.3M18.5 10.5l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SunsetIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 17a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M2 17h20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M9 12.5l3 3 3-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M5.5 10.5l1.3 1.3M18.5 10.5l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ThermometerIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M12 3.5a2 2 0 0 0-2 2v8.6a3.6 3.6 0 1 0 4 0V5.5a2 2 0 0 0-2-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
      />
      <circle cx="12" cy="16.8" r="2" fill="currentColor" />
    </svg>
  );
}

export function RefreshIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5M19.5 12a7.5 7.5 0 0 1-12.6 5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M17.5 3.5v3.6h-3.6M6.5 20.5v-3.6h3.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function DiscordIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M6.2 6.8C8 5.9 9.9 5.4 12 5.4s4 .5 5.8 1.4c1.3 2.1 2 4.6 2 7.4 0 0-1.8 1.9-4.4 2.4l-.7-1.4c.9-.3 1.7-.7 2.4-1.2-2 .9-4 1.4-6.1 1.4s-4.1-.5-6.1-1.4c.7.5 1.5.9 2.4 1.2l-.7 1.4c-2.6-.5-4.4-2.4-4.4-2.4 0-2.8.7-5.3 2-7.4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <ellipse cx="9.2" cy="12.3" rx="1.1" ry="1.3" fill="currentColor" />
      <ellipse cx="14.8" cy="12.3" rx="1.1" ry="1.3" fill="currentColor" />
    </svg>
  );
}

export function HomeIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M4 11.5 12 4l8 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M6 10v9.5h5V15h2v4.5h5V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function RadarIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.75" />
      <path d="M12 12 18 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function HailIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M7.5 11a4.1 4.1 0 0 1-.5-8.15A5.4 5.4 0 0 1 17.5 4.1a3.9 3.9 0 0 1-.5 6.9H7.5z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="8" cy="16" r="1.6" fill="currentColor" />
      <circle cx="13" cy="19" r="1.6" fill="currentColor" />
      <circle cx="17" cy="15.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function PlugIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M9 2.5v4M15 2.5v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 6.5h11v4a5.5 5.5 0 0 1-11 0v-4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M12 16v3.5M9 21.5h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

export function DotsIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="6" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="18" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function CameraIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1-1.8h7l1 1.8h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.7" fill="none" />
    </svg>
  );
}

export function ClockIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <path
        d="M12 7.5v5l3.5 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function OutlookMapIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M9 4.5 4 6.3v13.2l5-1.8 6 1.8 5-1.8V4.5l-5 1.8-6-1.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9 4.5v13.2M15 6.3v13.2" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

export function UserIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UsersIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M2.7 19.5c1.2-3.2 3.7-4.9 6.3-4.9s5.1 1.7 6.3 4.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M15.5 5.2a3.2 3.2 0 0 1 0 6.2M18.3 14.9c1.7.7 3 2.1 3.7 4.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
}

export function InfoIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 11v6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="12" cy="7.6" r="1.15" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6.5 4.5v15l13-7.5-13-7.5z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" />
    </svg>
  );
}

export function PlusIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 4.5v15M4.5 12h15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function LogoutIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M9.5 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 16.5 20 12l-4.5-4.5M20 12H9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


export function LocateIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SpeakerIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SpeakerMuteIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
