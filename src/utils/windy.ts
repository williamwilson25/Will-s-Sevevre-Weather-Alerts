// Windy's embeddable radar widget — reliable, well-established commercial
// radar coverage that recenters on whatever location is passed in, unlike a
// fixed local-TV-station embed.
export function buildWindyRadarUrl(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(3);
  const lon = longitude.toFixed(3);
  const params = new URLSearchParams({
    lat,
    lon,
    detailLat: lat,
    detailLon: lon,
    zoom: '7',
    level: 'surface',
    overlay: 'radar',
    product: 'radar',
    menu: '',
    message: 'true',
    marker: 'true',
    calendar: 'now',
    pressure: '',
    type: 'map',
    location: 'coordinates',
    detail: '',
    metricWind: 'default',
    metricTemp: 'default',
    radarRange: '-1',
  });
  return `https://embed.windy.com/embed2.html?${params.toString()}`;
}
