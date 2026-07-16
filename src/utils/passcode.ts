// Hash of the passcode that unlocks the Friends & Alerts tab. This is a
// client-side deterrent (there's no backend to hold a real secret) — it
// keeps casual visitors to the public link from sending alerts, not a
// substitute for real authentication.
export const PASSCODE_HASH = 'b9270ef103a6a5d4d21a75330111fd651df4f3b75b81f81dd580820e4ee9aad0';

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPasscode(input: string): Promise<boolean> {
  const hash = await sha256Hex(input.trim());
  return hash === PASSCODE_HASH;
}
