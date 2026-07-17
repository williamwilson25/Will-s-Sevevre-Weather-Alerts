import type { AlertRecord, Friend } from '../types';

interface Props {
  history: AlertRecord[];
  friends: Friend[];
}

export default function AlertStats({ history, friends }: Props) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sentThisWeek = history.filter((h) => new Date(h.createdAt).getTime() >= weekAgo).length;
  const latest = [...history].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <section className="alert-stats">
      <h2>Overview</h2>
      {latest && (
        <div className="alert-stats-latest">
          <span className="alert-stats-latest-label">Last sent</span>
          <span className="alert-stats-latest-headline">{latest.headline}</span>
        </div>
      )}
      <div className="alert-stats-grid">
        <div className="alert-stat">
          <span className="alert-stat-value">{history.length}</span>
          <span className="alert-stat-label">Alerts sent</span>
        </div>
        <div className="alert-stat">
          <span className="alert-stat-value">{sentThisWeek}</span>
          <span className="alert-stat-label">This week</span>
        </div>
        <div className="alert-stat">
          <span className="alert-stat-value">{friends.length}</span>
          <span className="alert-stat-label">Friends</span>
        </div>
      </div>
    </section>
  );
}
