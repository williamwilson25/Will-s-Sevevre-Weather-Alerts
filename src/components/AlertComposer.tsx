import { useEffect, useMemo, useState } from 'react';
import type { AlertRecord, AlertSeverity, DailyForecast, Friend } from '../types';
import { buildAlertMessage, buildSmsLink, SEVERITY_COLOR, SEVERITY_LABEL } from '../utils/alerts';
import { postToDiscord } from '../utils/discord';
import { sendAppNotification } from '../api/customAlerts';
import Avatar from './Avatar';
import QuickAlertPresets, { type AlertPreset } from './QuickAlertPresets';
import { BellAlertIcon } from './icons';

interface Props {
  ownerUid: string;
  locationName: string;
  daily: DailyForecast[];
  friends: Friend[];
  selectedDate: string | null;
  discordWebhookUrl: string;
  onSent: (record: AlertRecord) => void;
}

function riskToSeverity(level: DailyForecast['risk']['level']): AlertSeverity {
  switch (level) {
    case 'high':
      return 'emergency';
    case 'moderate':
      return 'warning';
    case 'enhanced':
      return 'watch';
    default:
      return 'advisory';
  }
}

export default function AlertComposer({
  ownerUid,
  locationName,
  daily,
  friends,
  selectedDate,
  discordWebhookUrl,
  onSent,
}: Props) {
  const [dateKey, setDateKey] = useState(selectedDate ?? daily[0]?.date ?? '');
  const [severity, setSeverity] = useState<AlertSeverity>('advisory');
  const [note, setNote] = useState('');
  const [typeLabel, setTypeLabel] = useState('');
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [alsoDiscord, setAlsoDiscord] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentFlash, setSentFlash] = useState('');
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    if (selectedDate) setDateKey(selectedDate);
  }, [selectedDate]);

  const day = useMemo(() => daily.find((d) => d.date === dateKey) ?? daily[0], [daily, dateKey]);

  useEffect(() => {
    if (day) setSeverity(riskToSeverity(day.risk.level));
    setTypeLabel('');
  }, [day]);

  if (!day) return null;

  const { headline, body } = buildAlertMessage(day, severity, note, typeLabel);
  const directFriends = friends.filter((f) => f.deliveryMethod !== 'discord');
  const discordFriends = friends.filter((f) => f.deliveryMethod === 'discord');
  const recipients = directFriends.filter((f) => recipientIds.includes(f.id));
  const appRecipients = recipients.filter((f) => f.deliveryMethod === 'app' && f.uid);
  const textRecipients = recipients.filter((f) => f.deliveryMethod !== 'app');

  function toggleRecipient(id: string) {
    setRecipientIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  function applyPreset(preset: AlertPreset) {
    setSeverity(preset.severity);
    setNote(preset.note);
    setTypeLabel(preset.label);
  }

  const willPostToDiscord = Boolean(discordWebhookUrl) && alsoDiscord;

  async function handleSend() {
    if (recipients.length === 0 && !willPostToDiscord) return;
    setSending(true);
    setSendError('');
    const errors: string[] = [];

    textRecipients.forEach((friend) => {
      window.open(buildSmsLink(friend, body), '_blank');
    });

    if (appRecipients.length > 0) {
      try {
        await sendAppNotification(
          ownerUid,
          appRecipients.map((f) => f.uid!),
          headline,
          body,
          severity,
        );
      } catch {
        errors.push('the app notification failed to send');
      }
    }

    if (willPostToDiscord) {
      try {
        await postToDiscord(discordWebhookUrl, headline, body, SEVERITY_COLOR[severity]);
      } catch {
        errors.push('the Discord post failed — check the webhook URL in settings');
      }
    }

    if (errors.length > 0) {
      setSendError(`Some alerts went out, but ${errors.join(', and ')}.`);
    }

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
    setSending(false);
    const parts = [];
    if (recipients.length > 0) parts.push(`${recipients.length} friend${recipients.length === 1 ? '' : 's'}`);
    if (willPostToDiscord) parts.push('Discord');
    setSentFlash(`Alert sent to ${parts.join(' and ')}.`);
    setTimeout(() => setSentFlash(''), 4000);
  }

  return (
    <section className="alert-composer">
      <h2>Compose alert</h2>

      <QuickAlertPresets onSelect={applyPreset} />

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
        <select
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value as AlertSeverity);
            setTypeLabel('');
          }}
        >
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
        ) : directFriends.length === 0 ? (
          <p className="empty-state">All your friends get alerts via Discord — nothing to send here.</p>
        ) : (
          <div className="recipient-grid">
            {directFriends.map((friend) => (
              <label key={friend.id} className="recipient-checkbox">
                <input
                  type="checkbox"
                  checked={recipientIds.includes(friend.id)}
                  onChange={() => toggleRecipient(friend.id)}
                />
                <Avatar name={friend.name} size={20} />
                {friend.name}
                {friend.deliveryMethod === 'app' && friend.uid && (
                  <span className="recipient-app-badge">
                    <BellAlertIcon size={11} /> App
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {discordWebhookUrl && (
        <label className="discord-toggle">
          <input
            type="checkbox"
            checked={alsoDiscord}
            onChange={(e) => setAlsoDiscord(e.target.checked)}
          />
          Also post to Discord
          {discordFriends.length > 0 && (
            <span className="discord-toggle-hint">
              — reaches {discordFriends.length} friend{discordFriends.length === 1 ? '' : 's'} who
              {discordFriends.length === 1 ? ' gets' : ' get'} alerts this way
            </span>
          )}
        </label>
      )}
      {discordFriends.length > 0 && !discordWebhookUrl && (
        <p className="form-error">
          {discordFriends.length} friend{discordFriends.length === 1 ? '' : 's'}{' '}
          {discordFriends.length === 1 ? 'gets' : 'get'} alerts via Discord, but no webhook is set
          up yet — add one in Discord alerts below.
        </p>
      )}

      <div className="alert-preview" id="compose-preview">
        <div className="alert-preview-label">Preview</div>
        <pre>{body}</pre>
      </div>

      <button
        type="button"
        className="send-button"
        disabled={(recipients.length === 0 && !willPostToDiscord) || sending}
        onClick={handleSend}
      >
        {sending
          ? 'Sending…'
          : `Send alert${recipients.length > 0 ? ` to ${recipients.length} friend${recipients.length === 1 ? '' : 's'}` : ''}${willPostToDiscord ? (recipients.length > 0 ? ' + Discord' : ' to Discord') : ''}`}
      </button>
      {sendError && <p className="form-error">{sendError}</p>}
      {sentFlash && <p className="sent-flash">{sentFlash}</p>}
    </section>
  );
}
