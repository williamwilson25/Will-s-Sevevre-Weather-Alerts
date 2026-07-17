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
  pressure: number;
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  precipitationProbability: number;
  weatherCode: number;
  windGusts: number;
  uvIndex: number;
  visibility: number;
  dewPoint: number;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windSpeedMax: number;
  windGustsMax: number;
  windDirection: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
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

export type DeliveryMethod = 'text' | 'discord';

export interface Friend {
  id: string;
  name: string;
  phone: string;
  deliveryMethod?: DeliveryMethod;
  location?: Location;
  uid?: string;
}

export interface Subscriber {
  uid: string;
  email: string;
  phone: string;
  location: Location;
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
