import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { AlertRecord, AlertSeverity, Friend } from '../types';
import { SEVERITY_COLOR, SEVERITY_LABEL } from '../utils/alerts';
import { AlertTriangleIcon, ChevronDownIcon } from './icons';

interface Props {
  history: AlertRecord[];
  friends: Friend[];
  onClear: () => void;
}

type Filter = 'all' | 'warnings' | 'watches' | 'others';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'watches', label: 'Watches' },
  { key: 'others', label: 'Others' },
];

function matchesFilter(severity: AlertSeverity, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'warnings') return severity === 'warning' || severity === 'emergency';
  if (filter === 'watches') return severity === 'watch';
  return severity === 'advisory';
}

export default function AlertHistory({ history, friends, onClear }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) {
    return (
      <section className="alert-history">
        <h2>Sent alerts</h2>
        <p className="empty-state">No alerts sent yet.</p>
      </section>
    );
  }

  const nameFor = (id: string) => friends.find((f) => f.id === id)?.name ?? 'Removed friend';
  const sorted = [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const filtered = sorted.filter((r) => matchesFilter(r.severity, filter));

  return (
    <section className="alert-history">
      <div className="alert-history-header">
        <h2>Sent alerts</h2>
        <button type="button" className="link-button" onClick={onClear}>
          Clear history
        </button>
      </div>

      <div className="history-filter-tabs">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'active' : ''}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">No alerts in this category.</p>
      ) : (
        <ul className="history-list">
          {filtered.map((record) => {
            const expanded = expandedId === record.id;
            return (
              <li
                key={record.id}
                className="history-item"
                style={{ '--severity-color': SEVERITY_COLOR[record.severity] } as CSSProperties}
              >
                <button
                  type="button"
                  className="history-row"
                  onClick={() => setExpandedId(expanded ? null : record.id)}
                  aria-expanded={expanded}
                >
                  <span className="history-icon" style={{ color: SEVERITY_COLOR[record.severity] }}>
                    <AlertTriangleIcon size={16} />
                  </span>
                  <div className="history-body">
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
                  </div>
                  <span className="history-badge">Sent</span>
                  <ChevronDownIcon
                    size={14}
                    className={`history-chevron${expanded ? ' history-chevron-open' : ''}`}
                  />
                </button>
                {expanded && <p className="history-message">{record.message}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
