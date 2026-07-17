const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function degreesToCompass(deg: number): string {
  const index = Math.round(deg / 45) % 8;
  return DIRECTIONS[index];
}
