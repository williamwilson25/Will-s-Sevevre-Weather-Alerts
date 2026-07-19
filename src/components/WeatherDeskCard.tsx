import { useEffect, useState } from 'react';
import { watchWeatherDesk, updateWeatherDesk, type WeatherDeskMessage } from '../api/weatherDesk';
import { suggestWeatherDeskMessage } from '../utils/weatherDeskSuggestion';
import type { SevereRisk } from '../types';
import logo from '../assets/logo.png';

interface Props {
  isOwner: boolean;
  locationName: string;
  risk: SevereRisk | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function WeatherDeskCard({ isOwner, locationName, risk }: Props) {
  const [msg, setMsg] = useState<WeatherDeskMessage | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => watchWeatherDesk(setMsg), []);

  if (!msg?.message && !isOwner) return null;

  function startEdit() {
    setDraft(msg?.message ?? '');
    setEditing(true);
  }

  function applySuggestion() {
    if (risk) setDraft(suggestWeatherDeskMessage(locationName, risk));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateWeatherDesk(draft.trim());
      setEditing(false);
    } catch {
      // the owner will just see the edit form still open and can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="weather-desk-card">
      <div className="weather-desk-header">
        <img src={logo} alt="" className="weather-desk-avatar" />
        <div className="weather-desk-heading">
          <h2>Will's Weather Desk</h2>
          {msg?.message && <span className="weather-desk-updated">Updated {formatTime(msg.updatedAt)}</span>}
        </div>
        {isOwner && !editing && (
          <button type="button" className="weather-desk-edit" onClick={startEdit}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="weather-desk-edit-form">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Good morning! Here's what to expect today…"
          />
          {risk && (
            <button type="button" className="weather-desk-suggest" onClick={applySuggestion}>
              Suggest message for today
            </button>
          )}
          <div className="weather-desk-edit-actions">
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button type="button" className="weather-desk-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : msg?.message ? (
        <p className="weather-desk-message">{msg.message}</p>
      ) : (
        <p className="empty-state">Nothing posted yet — tap Edit to write today's message.</p>
      )}
    </section>
  );
}
