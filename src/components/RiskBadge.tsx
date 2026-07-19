import type { CSSProperties } from 'react';
import type { RiskLevel } from '../types';
import { RISK_COLOR, RISK_LABEL, RISK_NUMBER } from '../utils/severity';

interface Props {
  level: RiskLevel;
  score: number;
  compact?: boolean;
}

export default function RiskBadge({ level, score, compact }: Props) {
  return (
    <span
      className={`risk-badge risk-${level}${compact ? ' risk-badge-compact' : ''}`}
      style={{ '--risk-color': RISK_COLOR[level] } as CSSProperties}
    >
      {RISK_LABEL[level]} · {RISK_NUMBER[level]}/5
      {!compact && ` · ${score}%`}
    </span>
  );
}
