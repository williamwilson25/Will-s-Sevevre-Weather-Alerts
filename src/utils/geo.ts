import { CITIES, type CityPoint } from '../data/cities';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function nearbyCities(lat: number, lon: number, count = 14): CityPoint[] {
  const seen = new Set<string>();
  return CITIES.map((city) => ({ city, distance: haversineKm(lat, lon, city.lat, city.lon) }))
    .sort((a, b) => a.distance - b.distance)
    .filter(({ city }) => {
      const key = `${city.name}|${city.lat}|${city.lon}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, count)
    .map(({ city }) => city);
}
