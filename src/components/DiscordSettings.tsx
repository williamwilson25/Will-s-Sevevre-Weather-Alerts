import { useState } from 'react';
import type { FormEvent } from 'react';
import { postToDiscord } from '../utils/discord';

interface Props {
  webhookUrl: string;
  onChange: (url: string) => void;
}

export default function DiscordSettings({ webhookUrl, onChange }: Props) {
  const [input, setInput] = useState(webhookUrl);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState('');

  function handleSave(e: FormEvent) {
    e.preventDefault();
    onChange(input.trim());
  }

  async function handleTest() {
    if (!webhookUrl) return;
    setTesting(true);
    setTestStatus('');
    try {
      await postToDiscord(
        webhookUrl,
        "Test alert from Will's Severe Weather Alerts",
        'If you can see this in Discord, alerts are set up correctly.',
        '#38bdf8',
      );
      setTestStatus('Sent — check Discord.');
    } catch {
      setTestStatus("Couldn't reach Discord. Double check the webhook URL.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="discord-settings">
      <h2>Discord alerts</h2>
      <p className="discord-subtitle">
        Paste a channel webhook URL to also post every alert to Discord.
      </p>
      <form onSubmit={handleSave} className="discord-form">
        <input
          type="url"
          placeholder="https://discord.com/api/webhooks/..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Discord webhook URL"
        />
        <button type="submit">Save</button>
      </form>
      {webhookUrl && (
        <button type="button" className="discord-test-button" onClick={handleTest} disabled={testing}>
          {testing ? 'Sending…' : 'Send test message'}
        </button>
      )}
      {testStatus && <p className="discord-test-status">{testStatus}</p>}
    </section>
  );
}
