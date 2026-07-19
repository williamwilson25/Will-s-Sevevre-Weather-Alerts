import type { CSSProperties } from 'react';
import type { SevereRisk } from '../types';
import { RISK_COLOR, RISK_LABEL, RISK_NUMBER } from '../utils/severity';
import { ChevronDownIcon } from './icons';

interface Props {
  risk: SevereRisk;
  onViewOutlook?: () => void;
}

export default function TodaysOutlookRow({ risk, onViewOutlook }: Props) {
  const color = RISK_COLOR[risk.level];
  return (
    <section className="outlook-row-card">
      <button
        type="button"
        className="outlook-row"
        onClick={onViewOutlook}
        disabled={!onViewOutlook}
        style={{ '--risk-color': color } as CSSProperties}
      >
        <span className="outlook-row-label">Today's Outlook</span>
        <span className="outlook-row-value">
          {RISK_LABEL[risk.level]} Risk
          <span className="outlook-row-fraction">{RISK_NUMBER[risk.level]}/5</span>
          {onViewOutlook && <ChevronDownIcon size={14} className="outlook-row-chevron" />}
        </span>
      </button>
    </section>
  );
}
