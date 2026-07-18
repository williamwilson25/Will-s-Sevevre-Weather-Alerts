import type { RiskLevel, SevereRisk } from '../types';
import { RISK_LABEL, RISK_COLOR } from '../utils/severity';

interface Props {
  risk: SevereRisk;
}

const ZONES: { from: number; to: number; level: RiskLevel }[] = [
  { from: 0, to: 18, level: 'low' },
  { from: 18, to: 40, level: 'moderate' },
  { from: 40, to: 65, level: 'high' },
  { from: 65, to: 100, level: 'severe' },
];

const CX = 100;
const CY = 96;
const R = 78;
const NEEDLE_LEN = 62;

function angleFor(score: number): number {
  // score 0 -> 180deg (left), score 100 -> 0deg (right)
  return 180 - (Math.max(0, Math.min(100, score)) / 100) * 180;
}

function pointAt(score: number, radius: number) {
  const rad = (angleFor(score) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function arcPath(from: number, to: number, radius: number): string {
  const start = pointAt(from, radius);
  const end = pointAt(to, radius);
  const largeArc = to - from > 100 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function StormRiskMeter({ risk }: Props) {
  const needle = pointAt(risk.score, NEEDLE_LEN);
  const color = RISK_COLOR[risk.level];

  return (
    <section className="risk-meter-card">
      <h2>Storm Risk Meter</h2>
      <svg viewBox="0 0 200 116" className="risk-meter-gauge">
        {ZONES.map((zone) => (
          <path
            key={zone.level}
            d={arcPath(zone.from, zone.to, R)}
            stroke={RISK_COLOR[zone.level]}
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            opacity={risk.level === zone.level ? 1 : 0.4}
          />
        ))}
        <line
          x1={CX}
          y1={CY}
          x2={needle.x}
          y2={needle.y}
          stroke="#f8fafc"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="6" fill="#f8fafc" />
      </svg>
      <div className="risk-meter-readout">
        <span className="risk-meter-level" style={{ color }}>
          {RISK_LABEL[risk.level].toUpperCase()}
        </span>
        <span className="risk-meter-caption">
          {risk.level === 'low' ? 'No significant storm risk today.' : 'Stay weather aware.'}
        </span>
      </div>
    </section>
  );
}
