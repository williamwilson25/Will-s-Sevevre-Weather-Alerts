import { useEffect, useMemo, useState } from 'react';
import type { AlertRecord, AlertSeverity, DailyForecast, Friend } from '../types';
import { buildAlertMessage, buildSmsLink, SEVERITY_LABEL } from '../utils/alerts';
import Avatar from './Avatar';

interface Props {
  locationName: string;
  daily: DailyForecast[];
  friends: Friend[];
  selectedDate: string | null;
  onSent: (record: AlertRecord) => void;
}

function riskToSeverity(level: DailyForecast['risk']['level']): AlertSeverity {
  switch (level) {
    case 'severe':
      return 'emergency';
    case 'high':
      return 'warning';
    case 'moderate':
      return 'watch';
    default:
      return 'advisory';
  }
}

export default function AlertComposer({ locationName, daily, friends, selectedDate, onSent }: Props) {
  const [dateKey, setDateKey] = useState(selectedDate ?? daily[0]?.date ?? '');
  const [severity, setSeverity] = useState<AlertSeverity>('advisory');
  const [note, setNote] = useState('');
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [sentFlash, setSentFlash] = useState('');

  useEffect(() => {
    if (selectedDate) setDateKey(selectedDate);
  }, [selectedDate]);

  const day = useMemo(() => daily.find((d) => d.date === dateKey) ?? daily[0], [daily, dateKey]);

  useEffect(() => {
    if (day) setSeverity(riskToSeverity(day.risk.level));
  }, [day]);

  if (!day) return null;

  const { headline, body } = buildAlertMessage(locationName, day, severity, note);
  const recipients = friends.filter((f) => recipientIds.includes(f.id));

  function toggleRecipient(id: string) {
    setRecipientIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function handleSend() {
    if (recipients.length === 0) return;
    recipients.forEach((friend) => {
      window.open(buildSmsLink(friend, body), '_blank');
    });

    const record: AlertRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      recipientIds,
      severity,
      headline,
      message: body,
      locationName,
    };
    onSent(record);
    setSentFlash(`Alert queued for ${recipients.length} friend${recipients.length === 1 ? '' : 's'}.`);
    setTimeout(() => setSentFlash(''), 4000);
  }

  return (
    <section className="alert-composer">
      <h2>Compose alert</h2>

      <label className="field">
        <span>Day</span>
        <select value={dateKey} onChange={(e) => setDateKey(e.target.value)}>
          {daily.map((d, i) => (
            <option key={d.date} value={d.date}>
              {i === 0
                ? 'Today'
                : new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
              — {d.risk.level} risk ({d.risk.score}%)
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Severity</span>
        <select value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity)}>
          {(Object.keys(SEVERITY_LABEL) as AlertSeverity[]).map((key) => (
            <option key={key} value={key}>
              {SEVERITY_LABEL[key]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Personal note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Bring the patio furniture in tonight!"
          rows={2}
        />
      </label>

      <fieldset className="field recipient-field">
        <legend>Send to</legend>
        {friends.length === 0 ? (
          <p className="empty-state">Add friends first to select recipients.</p>
        ) : (
          <div className="recipient-grid">
            {friends.map((friend) => (
              <label key={friend.id} className="recipient-checkbox">
                <input
                  type="checkbox"
                  checked={recipientIds.includes(friend.id)}
                  onChange={() => toggleRecipient(friend.id)}
                />
                <Avatar name={friend.name} size={20} />
                {friend.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="alert-preview">
        <div className="alert-preview-label">Preview</div>
        <pre>{body}</pre>
      </div>

      <button
        type="button"
        className="send-button"
        disabled={recipients.length === 0}
        onClick={handleSend}
      >
        Send alert to {recipients.length || 0} friend{recipients.length === 1 ? '' : 's'}
      </button>
      {sentFlash && <p className="sent-flash">{sentFlash}</p>}
    </section>
  );
}
