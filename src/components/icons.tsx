interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true } as const;
}

export function SunIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="4.6" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.85">
        <path d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
      </g>
    </svg>
  );
}

export function MoonIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function CloudBase({ opacity = 1 }: { opacity?: number }) {
  return (
    <path
      d="M7.5 18.5a4.3 4.3 0 0 1-.6-8.55 5.6 5.6 0 0 1 10.8-2.1A4.05 4.05 0 0 1 17 15.5H7.5z"
      fill="currentColor"
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
      <circle cx="8.2" cy="7.8" r="3.4" fill="currentColor" opacity="0.85" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <path d="M8.2 2.4v1.4M3.4 7.8h1.4M4.6 3.8l1 1M13 4.4l-1 1" />
      </g>
      <path
        d="M8 18.5a4.1 4.1 0 0 1-.5-8.15A5.4 5.4 0 0 1 18 11.6 3.9 3.9 0 0 1 17.5 19H8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CloudMoonIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M13.4 8.1a4.7 4.7 0 0 1-5.4-6A6.6 6.6 0 1 0 13.4 8.1z" fill="currentColor" opacity="0.8" />
      <path
        d="M8 18.5a4.1 4.1 0 0 1-.5-8.15A5.4 5.4 0 0 1 18 11.6 3.9 3.9 0 0 1 17.5 19H8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CloudsIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M4.3 15.2a3.4 3.4 0 0 1 .6-6.75A4.5 4.5 0 0 1 13.5 7a3.2 3.2 0 0 1 2.2 5.7 3 3 0 0 1-.7 5.3H5.4a2.9 2.9 0 0 1-1.1-2.8z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M8.5 19a4.1 4.1 0 0 1-.5-8.15A5.4 5.4 0 0 1 18.5 12.1a3.9 3.9 0 0 1-.5 6.9H8.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CloudRainIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M7.5 15.5a4.1 4.1 0 0 1-.5-8.15A5.4 5.4 0 0 1 17.5 8.6a3.9 3.9 0 0 1-.5 6.9H7.5z"
        fill="currentColor"
      />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.75">
        <path d="M8.5 18v2.6M12.5 18v2.6M16.5 18v2.6" />
      </g>
    </svg>
  );
}

export function CloudLightningIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M7.5 14.5a4.1 4.1 0 0 1-.5-8.15A5.4 5.4 0 0 1 17.5 7.6a3.9 3.9 0 0 1-.5 6.9H7.5z"
        fill="currentColor"
      />
      <path d="M13 14.5 10 19h2.6l-1.4 4.5 5-6.2h-2.7l1.4-2.8z" fill="currentColor" />
    </svg>
  );
}

export function CloudSnowIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M7.5 15.5a4.1 4.1 0 0 1-.5-8.15A5.4 5.4 0 0 1 17.5 8.6a3.9 3.9 0 0 1-.5 6.9H7.5z"
        fill="currentColor"
      />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.75">
        <path d="M8.5 18.3v3M7.1 19.8h2.8M12.5 18.3v3M11.1 19.8h2.8M16.5 18.3v3M15.1 19.8h2.8" />
      </g>
    </svg>
  );
}

export function CloudFogIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M7.5 13.8a4.1 4.1 0 0 1-.4-8.1A5.4 5.4 0 0 1 17.3 6.8a3.9 3.9 0 0 1-.5 6.9H7.5z"
        fill="currentColor"
        opacity="0.85"
      />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
        <path d="M5 17.5h14M6.5 20.5h11" />
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

export function StormLogoIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M7 14.8a4.3 4.3 0 0 1-.6-8.55A5.7 5.7 0 0 1 17.5 7.9a4.05 4.05 0 0 1-.7 8.1H7z"
        fill="currentColor"
      />
      <path d="M12.6 15 9.8 19.2h2.4l-1.2 4 4.4-5.5h-2.3l1.2-2.7z" fill="currentColor" />
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

export function LockIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5.5" y="11" width="13" height="9.5" rx="2.2" fill="currentColor" opacity="0.85" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="15.4" r="1.4" fill="#0b1220" />
    </svg>
  );
}

export function LockOpenIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5.5" y="11" width="13" height="9.5" rx="2.2" fill="currentColor" opacity="0.85" />
      <path
        d="M8 11V8a4 4 0 0 1 7.7-1.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="15.4" r="1.4" fill="#0b1220" />
    </svg>
  );
}
