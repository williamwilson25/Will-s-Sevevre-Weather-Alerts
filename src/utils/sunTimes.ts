// NWS doesn't publish sunrise/sunset — computed locally via the standard sunrise
// equation (the same public-domain solar-position algorithm NOAA's own solar
// calculator uses), accurate to within a minute or two.
function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

export function computeSunTimes(date: Date, latitude: number, longitude: number): SunTimes {
  const julianDate = date.getTime() / 86400000 + 2440587.5;
  const n = Math.floor(julianDate - 2451545.0 + 0.0008);

  const meanSolarTime = n - longitude / 360;
  const solarMeanAnomalyDeg = (357.5291 + 0.98560028 * meanSolarTime) % 360;
  const M = toRadians(solarMeanAnomalyDeg);
  const C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
  const eclipticLongDeg = (solarMeanAnomalyDeg + C + 180 + 102.9372) % 360;
  const lambda = toRadians(eclipticLongDeg);

  const solarTransitJulian =
    2451545.0 + meanSolarTime + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * lambda);

  const declination = Math.asin(Math.sin(lambda) * Math.sin(toRadians(23.44)));
  const latRad = toRadians(latitude);
  const cosHourAngle =
    (Math.sin(toRadians(-0.83)) - Math.sin(latRad) * Math.sin(declination)) /
    (Math.cos(latRad) * Math.cos(declination));

  const julianToDate = (jd: number) => new Date((jd - 2440587.5) * 86400000);

  if (cosHourAngle > 1 || cosHourAngle < -1) {
    // polar day/night — sun doesn't rise or set; fall back to the transit time for both
    const transit = julianToDate(solarTransitJulian);
    return { sunrise: transit, sunset: transit };
  }

  const hourAngle = toDegrees(Math.acos(cosHourAngle));
  return {
    sunrise: julianToDate(solarTransitJulian - hourAngle / 360),
    sunset: julianToDate(solarTransitJulian + hourAngle / 360),
  };
}
