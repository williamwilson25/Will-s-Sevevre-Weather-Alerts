export interface Location {
  id: string;
  name: string;
  admin1?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface CurrentConditions {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
  windGusts: number;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windSpeedMax: number;
  windGustsMax: number;
  uvIndexMax: number;
  risk: SevereRisk;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface SevereRisk {
  level: RiskLevel;
  score: number;
  reasons: string[];
}

export interface WeatherSnapshot {
  location: Location;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyForecast[];
  fetchedAt: string;
}

export interface Friend {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';

export interface AlertRecord {
  id: string;
  createdAt: string;
  recipientIds: string[];
  severity: AlertSeverity;
  headline: string;
  message: string;
  locationName: string;
}
