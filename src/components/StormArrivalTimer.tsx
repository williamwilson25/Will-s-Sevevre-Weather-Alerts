import { ClockIcon } from './icons';

interface Props {
  minutesAway: number;
}

export default function StormArrivalTimer({ minutesAway }: Props) {
  const arrival = new Date(Date.now() + minutesAway * 60000);
  const timeLabel = arrival.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <section className="arrival-timer-card">
      <div className="arrival-timer-icon">
        <ClockIcon size={24} />
      </div>
      <div className="arrival-timer-body">
        <div className="arrival-timer-label">Storms arriving in</div>
        <div className="arrival-timer-value">{minutesAway} MIN</div>
        <div className="arrival-timer-around">Around {timeLabel}</div>
      </div>
    </section>
  );
}
