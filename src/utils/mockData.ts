import { AQIData, PollutionSource, ForecastData, PolicyIntervention } from '../types';

export const mockAQIData: AQIData[] = [
  // Delhi-NCR
  { location: 'Connaught Place, Delhi', aqi: 312, pm25: 185, pm10: 245, no2: 68, so2: 22, co: 1.8, timestamp: new Date().toISOString(), lat: 28.6315, lng: 77.2167 },
  { location: 'Anand Vihar, Delhi', aqi: 398, pm25: 245, pm10: 312, no2: 89, so2: 31, co: 2.4, timestamp: new Date().toISOString(), lat: 28.6469, lng: 77.3158 },
  { location: 'Dwarka, Delhi', aqi: 278, pm25: 156, pm10: 198, no2: 54, so2: 18, co: 1.5, timestamp: new Date().toISOString(), lat: 28.5921, lng: 77.0460 },
  { location: 'Rohini, Delhi', aqi: 334, pm25: 198, pm10: 267, no2: 72, so2: 25, co: 2.1, timestamp: new Date().toISOString(), lat: 28.7495, lng: 77.0736 },
  { location: 'Noida, UP', aqi: 356, pm25: 212, pm10: 289, no2: 78, so2: 28, co: 2.2, timestamp: new Date().toISOString(), lat: 28.5355, lng: 77.3910 },
  { location: 'Gurgaon, Haryana', aqi: 289, pm25: 167, pm10: 223, no2: 65, so2: 21, co: 1.9, timestamp: new Date().toISOString(), lat: 28.4595, lng: 77.0266 },
  { location: 'Faridabad, Haryana', aqi: 324, pm25: 189, pm10: 256, no2: 71, so2: 24, co: 2.0, timestamp: new Date().toISOString(), lat: 28.4089, lng: 77.3178 },
  
  // Mumbai
  { location: 'Worli, Mumbai', aqi: 156, pm25: 89, pm10: 112, no2: 42, so2: 15, co: 1.1, timestamp: new Date().toISOString(), lat: 19.0176, lng: 72.8181 },
  { location: 'Andheri, Mumbai', aqi: 178, pm25: 98, pm10: 134, no2: 48, so2: 17, co: 1.3, timestamp: new Date().toISOString(), lat: 19.1136, lng: 72.8697 },
  { location: 'Bandra, Mumbai', aqi: 142, pm25: 78, pm10: 98, no2: 38, so2: 13, co: 1.0, timestamp: new Date().toISOString(), lat: 19.0596, lng: 72.8295 },
  
  // Bangalore
  { location: 'Silk Board, Bangalore', aqi: 134, pm25: 72, pm10: 89, no2: 35, so2: 12, co: 0.9, timestamp: new Date().toISOString(), lat: 12.9165, lng: 77.6226 },
  { location: 'Whitefield, Bangalore', aqi: 121, pm25: 65, pm10: 78, no2: 31, so2: 10, co: 0.8, timestamp: new Date().toISOString(), lat: 12.9698, lng: 77.7499 },
  { location: 'Indiranagar, Bangalore', aqi: 145, pm25: 79, pm10: 95, no2: 37, so2: 13, co: 1.0, timestamp: new Date().toISOString(), lat: 12.9716, lng: 77.6412 },
  
  // Kolkata
  { location: 'Park Street, Kolkata', aqi: 198, pm25: 112, pm10: 156, no2: 52, so2: 18, co: 1.4, timestamp: new Date().toISOString(), lat: 22.5542, lng: 88.3516 },
  { location: 'Salt Lake, Kolkata', aqi: 176, pm25: 95, pm10: 134, no2: 46, so2: 16, co: 1.2, timestamp: new Date().toISOString(), lat: 22.5697, lng: 88.4329 },
  { location: 'Howrah, Kolkata', aqi: 212, pm25: 124, pm10: 178, no2: 58, so2: 20, co: 1.6, timestamp: new Date().toISOString(), lat: 22.5958, lng: 88.2636 },
  
  // Chennai
  { location: 'T Nagar, Chennai', aqi: 98, pm25: 52, pm10: 67, no2: 28, so2: 9, co: 0.7, timestamp: new Date().toISOString(), lat: 13.0418, lng: 80.2341 },
  { location: 'Velachery, Chennai', aqi: 112, pm25: 61, pm10: 78, no2: 32, so2: 11, co: 0.8, timestamp: new Date().toISOString(), lat: 12.9750, lng: 80.2212 },
  { location: 'Anna Nagar, Chennai', aqi: 89, pm25: 47, pm10: 59, no2: 25, so2: 8, co: 0.6, timestamp: new Date().toISOString(), lat: 13.0850, lng: 80.2101 },
  
  // Hyderabad
  { location: 'Hitech City, Hyderabad', aqi: 145, pm25: 78, pm10: 98, no2: 39, so2: 13, co: 1.0, timestamp: new Date().toISOString(), lat: 17.4435, lng: 78.3772 },
  { location: 'Secunderabad', aqi: 167, pm25: 91, pm10: 123, no2: 45, so2: 15, co: 1.2, timestamp: new Date().toISOString(), lat: 17.4399, lng: 78.4983 },
  { location: 'Gachibowli, Hyderabad', aqi: 134, pm25: 71, pm10: 89, no2: 36, so2: 12, co: 0.9, timestamp: new Date().toISOString(), lat: 17.4400, lng: 78.3487 },
  
  // Pune
  { location: 'Shivaji Nagar, Pune', aqi: 156, pm25: 85, pm10: 112, no2: 42, so2: 14, co: 1.1, timestamp: new Date().toISOString(), lat: 18.5304, lng: 73.8567 },
  { location: 'Hinjewadi, Pune', aqi: 142, pm25: 76, pm10: 98, no2: 38, so2: 13, co: 1.0, timestamp: new Date().toISOString(), lat: 18.5912, lng: 73.7389 },
  { location: 'Kothrud, Pune', aqi: 134, pm25: 72, pm10: 89, no2: 35, so2: 12, co: 0.9, timestamp: new Date().toISOString(), lat: 18.5074, lng: 73.8077 },
  
  // Ahmedabad
  { location: 'Maninagar, Ahmedabad', aqi: 189, pm25: 105, pm10: 145, no2: 49, so2: 17, co: 1.3, timestamp: new Date().toISOString(), lat: 22.9969, lng: 72.6031 },
  { location: 'Satellite, Ahmedabad', aqi: 176, pm25: 96, pm10: 134, no2: 46, so2: 16, co: 1.2, timestamp: new Date().toISOString(), lat: 23.0258, lng: 72.5098 },
  { location: 'Vastrapur, Ahmedabad', aqi: 167, pm25: 89, pm10: 123, no2: 43, so2: 15, co: 1.1, timestamp: new Date().toISOString(), lat: 23.0395, lng: 72.5248 },
  
  // Jaipur
  { location: 'C-Scheme, Jaipur', aqi: 198, pm25: 112, pm10: 156, no2: 52, so2: 18, co: 1.4, timestamp: new Date().toISOString(), lat: 26.9124, lng: 75.7873 },
  { location: 'Malviya Nagar, Jaipur', aqi: 212, pm25: 123, pm10: 178, no2: 57, so2: 20, co: 1.5, timestamp: new Date().toISOString(), lat: 26.8523, lng: 75.8155 },
  { location: 'Vaishali Nagar, Jaipur', aqi: 189, pm25: 104, pm10: 145, no2: 48, so2: 17, co: 1.3, timestamp: new Date().toISOString(), lat: 26.9154, lng: 75.7277 },
  
  // Lucknow
  { location: 'Gomti Nagar, Lucknow', aqi: 234, pm25: 138, pm10: 198, no2: 62, so2: 21, co: 1.7, timestamp: new Date().toISOString(), lat: 26.8550, lng: 80.9803 },
  { location: 'Hazratganj, Lucknow', aqi: 256, pm25: 152, pm10: 223, no2: 68, so2: 23, co: 1.9, timestamp: new Date().toISOString(), lat: 26.8467, lng: 80.9462 },
  { location: 'Alambagh, Lucknow', aqi: 245, pm25: 145, pm10: 212, no2: 65, so2: 22, co: 1.8, timestamp: new Date().toISOString(), lat: 26.8200, lng: 80.8900 },
];

export const pollutionSources: PollutionSource[] = [
  { name: 'Stubble Burning', contribution: 35, color: '#ef4444' },
  { name: 'Vehicular Emissions', contribution: 28, color: '#f59e0b' },
  { name: 'Industrial Activity', contribution: 18, color: '#8b5cf6' },
  { name: 'Construction Dust', contribution: 12, color: '#06b6d4' },
  { name: 'Other Sources', contribution: 7, color: '#6b7280' },
];

export const forecastData: ForecastData[] = [
  { date: '2026-02-27', aqi: 312, confidence: 95 },
  { date: '2026-02-28', aqi: 298, confidence: 92 },
  { date: '2026-03-01', aqi: 276, confidence: 88 },
  { date: '2026-03-02', aqi: 254, confidence: 85 },
  { date: '2026-03-03', aqi: 243, confidence: 82 },
  { date: '2026-03-04', aqi: 267, confidence: 78 },
  { date: '2026-03-05', aqi: 289, confidence: 75 },
];

export const policyInterventions: PolicyIntervention[] = [
  { name: 'Odd-Even Policy', startDate: '2026-01-15', endDate: '2026-01-30', effectiveness: 68, aqiReduction: 42 },
  { name: 'Construction Ban', startDate: '2026-02-01', endDate: '2026-02-15', effectiveness: 54, aqiReduction: 28 },
  { name: 'Firecracker Ban', startDate: '2025-10-20', endDate: '2025-11-05', effectiveness: 72, aqiReduction: 56 },
];

export const getAQICategory = (aqi: number): { label: string; color: string; bgColor: string } => {
  if (aqi <= 50) return { label: 'Good', color: '#10b981', bgColor: '#d1fae5' };
  if (aqi <= 100) return { label: 'Moderate', color: '#f59e0b', bgColor: '#fef3c7' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#f97316', bgColor: '#fed7aa' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#ef4444', bgColor: '#fecaca' };
  return { label: 'Hazardous', color: '#991b1b', bgColor: '#fee2e2' };
};
