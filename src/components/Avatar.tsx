const PALETTE = ['#38bdf8', '#a78bfa', '#fb923c', '#4ade80', '#f472b6', '#facc15', '#60a5fa', '#2dd4bf'];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

interface Props {
  name: string;
  size?: number;
}

export default function Avatar({ name, size = 32 }: Props) {
  const color = PALETTE[hashName(name) % PALETTE.length];
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: color }}
    >
      {initials(name) || '?'}
    </span>
  );
}
