import { useState } from 'react';
import { AlertTriangleIcon, TornadoIcon, HailIcon, ChevronDownIcon, CheckCircleIcon } from './icons';

const TOPICS: { key: string; icon: typeof AlertTriangleIcon; title: string; body: string }[] = [
  {
    key: 'watch-warning',
    icon: AlertTriangleIcon,
    title: 'Watch vs. Warning',
    body: 'A Watch means conditions are favorable for severe weather to develop — stay alert and have a plan ready. A Warning means severe weather has been spotted or indicated by radar — take action immediately.',
  },
  {
    key: 'tornado',
    icon: TornadoIcon,
    title: 'Tornado Safety',
    body: 'Go to a basement or an interior room on the lowest floor, away from windows, and cover your head and neck. Mobile homes are not safe shelter — go to a sturdy building. If caught outside, lie flat in a low spot away from cars and trees.',
  },
  {
    key: 'hail',
    icon: HailIcon,
    title: 'Hail Safety',
    body: 'Move vehicles into a garage or covered area if you can do so safely. Stay away from windows and skylights. If driving, pull over under an overpass or sturdy shelter and wait it out.',
  },
  {
    key: 'preparedness',
    icon: CheckCircleIcon,
    title: 'Preparedness Checklist',
    body: 'Keep a battery-powered weather radio, flashlight, first aid kit, water, and a few days of non-perishable food on hand. Know your safe room ahead of time, keep phones charged before storms arrive, and turn on alerts for the counties you care about.',
  },
];

export default function StormSafetyCard() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <section className="safety-card">
      <h2>Storm Safety</h2>
      <ul className="safety-list">
        {TOPICS.map(({ key, icon: Icon, title, body }) => {
          const open = openKey === key;
          return (
            <li key={key} className="safety-item">
              <button
                type="button"
                className="safety-row"
                onClick={() => setOpenKey(open ? null : key)}
                aria-expanded={open}
              >
                <Icon size={18} className="safety-icon" />
                <span className="safety-title">{title}</span>
                <ChevronDownIcon size={15} className={`safety-chevron${open ? ' safety-chevron-open' : ''}`} />
              </button>
              {open && <p className="safety-body">{body}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
