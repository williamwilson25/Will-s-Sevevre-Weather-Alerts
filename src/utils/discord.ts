function colorToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export async function postToDiscord(
  webhookUrl: string,
  headline: string,
  body: string,
  colorHex: string,
): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: headline,
          description: body,
          color: colorToInt(colorHex),
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Discord webhook failed (${res.status})`);
  }
}
