import type { SevereRisk } from '../types';

// Short, friendly draft text for the Weather Desk card, tuned to each SPC
// risk tier — a starting point the owner reviews and edits before saving,
// not a final message posted on its own.
export function suggestWeatherDeskMessage(locationName: string, risk: SevereRisk): string {
  switch (risk.level) {
    case 'marginal':
      return `No significant storm risk today for ${locationName} — should be a calm one. Enjoy!`;
    case 'slight':
      return `A few isolated storms are possible today near ${locationName}. Nothing widespread expected, but keep an eye on the sky.`;
    case 'enhanced':
      return `Scattered storms possible today for ${locationName} — a few could turn strong. Stay weather aware and keep your phone handy.`;
    case 'moderate':
      return `Elevated risk of severe storms today for ${locationName} — damaging wind and large hail are possible. Make sure notifications are on.`;
    case 'high':
    default:
      return `High risk of severe weather today for ${locationName} — tornadoes, damaging wind, and large hail are all possible. Know your safe place and stay alert.`;
  }
}
