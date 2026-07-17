import type { Location } from '../types';

const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export function detectLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Location services are not available on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;
          const url = new URL(REVERSE_GEOCODE_URL);
          url.searchParams.set('latitude', String(latitude));
          url.searchParams.set('longitude', String(longitude));
          url.searchParams.set('localityLanguage', 'en');

          const res = await fetch(url.toString());
          if (!res.ok) throw new Error(`Reverse geocoding failed (${res.status})`);
          const data = await res.json();

          resolve({
            id: `geo:${latitude.toFixed(3)},${longitude.toFixed(3)}`,
            name: data.city || data.locality || data.principalSubdivision || 'My location',
            admin1: data.principalSubdivision || undefined,
            country: data.countryName || 'Unknown',
            latitude,
            longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Could not determine your city.'));
        }
      },
      (err) => {
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied.'
              : 'Could not get your location.',
          ),
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}
