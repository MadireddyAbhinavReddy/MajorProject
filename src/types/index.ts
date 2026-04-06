export interface AQIData {
  location: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  timestamp: string;
  lat: number;
  lng: number;
}

export interface PollutionSource {
  name: string;
  contribution: number;
  color: string;
}

export interface ForecastData {
  date: string;
  aqi: number;
  confidence: number;
}

export interface HealthAlert {
  level: string;
  message: string;
  recommendations: string[];
}

export interface PolicyIntervention {
  name: string;
  startDate: string;
  endDate: string;
  effectiveness: number;
  aqiReduction: number;
}
