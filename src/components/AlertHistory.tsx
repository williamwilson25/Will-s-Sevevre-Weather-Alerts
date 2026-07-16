import type { CSSProperties } from 'react';
import type { AlertRecord, Friend } from '../types';
import { SEVERITY_COLOR, SEVERITY_LABEL } from '../utils/alerts';

interface Props {
  history: AlertRecord[];
  friends: Friend[];
  onClear: () => void;
}

export default function AlertHistory({ history, friends, onClear }: Props) {
  if (history.length === 0) {
    return (
      <section className="alert-history">
        <h2>Sent alerts</h2>
        <p className="empty-state">No alerts sent yet.</p>
      </section>
    );
  }

  const nameFor = (id: string) => friends.find((f) => f.id === id)?.name ?? 'Removed friend';

  return (
    <section className="alert-history">
      <div className="alert-history-header">
        <h2>Sent alerts</h2>
        <button type="button" className="link-button" onClick={onClear}>
          Clear history
        </button>
      </div>
      <ul className="history-list">
        {[...history]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((record) => (
            <li
              key={record.id}
              className="history-item"
              style={{ '--severity-color': SEVERITY_COLOR[record.severity] } as CSSProperties}
            >
              <div
                className="history-severity"
                style={{ color: SEVERITY_COLOR[record.severity] }}
              >
                {SEVERITY_LABEL[record.severity]}
              </div>
              <div className="history-headline">{record.headline}</div>
              <div className="history-meta">
                To: {record.recipientIds.map(nameFor).join(', ')} ·{' '}
                {new Date(record.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
      </ul>
    </section>
  );
}
