import React, { useState, useEffect } from 'react';
import { AlertCircle, MapPin, Activity, Navigation, Locate, Loader } from 'lucide-react';
import { fetchZones, fetchZoneHistory, fetchForecast } from '../utils/api';
import { getAQICategory } from '../utils/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CitizenDashboard: React.FC = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchZones().then((data) => {
      setZones(data);
      setSelectedZone(data[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedZone) return;
    fetchZoneHistory(selectedZone.zone_id, 24).then(setHistory);
    fetchForecast(selectedZone.zone_id).then(setForecast);
  }, [selectedZone]);

  const findNearestZone = (lat: number, lng: number) => {
    return zones.reduce((nearest, zone) => {
      const d = Math.hypot(zone.lat - lat, zone.lng - lng);
      const nd = Math.hypot(nearest.lat - lat, nearest.lng - lng);
      return d < nd ? zone : nearest;
    });
  };

  const handleAutoDetect = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setSelectedZone(findNearestZone(coords.latitude, coords.longitude));
        setIsLocating(false);
      },
      () => {
        alert('Unable to detect location. Please select manually.');
        setIsLocating(false);
      }
    );
  };

  const getHealthRecommendations = (aqi: number): string[] => {
    if (aqi > 300) return [
      'Avoid all outdoor activities',
      'Keep windows closed, use air purifiers',
      'Wear N95 masks if going outside',
      'Consult a doctor if experiencing breathing issues',
    ];
    if (aqi > 200) return [
      'Limit outdoor activities',
      'Sensitive groups should stay indoors',
      'Wear masks when outside',
    ];
    if (aqi > 100) return [
      'Reduce prolonged outdoor exertion',
      'Sensitive individuals take precautions',
    ];
    return ['Air quality is acceptable', 'Enjoy outdoor activities'];
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
        <p className="text-gray-600">Loading real-time AQI data...</p>
      </div>
    </div>
  );

  const aqiCategory = selectedZone ? getAQICategory(selectedZone.aqi) : getAQICategory(0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">India Air Quality Monitor</h1>
          <p className="text-gray-600">Real-time pollution data with personalized health alerts</p>
        </div>

        {/* Location Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold">Select Your Location</h2>
            </div>
            <button
              onClick={handleAutoDetect}
              disabled={isLocating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLocating ? <><Loader className="animate-spin" size={18} /><span>Detecting...</span></> : <><Locate size={18} /><span>Auto-Detect</span></>}
            </button>
          </div>

          {userLocation && selectedZone && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              📍 Nearest station to your location: <strong>{selectedZone.label}</strong>
              <span className="text-green-600 ml-2">({userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E)</span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {zones.map((zone) => (
              <button
                key={zone.zone_id}
                onClick={() => setSelectedZone(zone)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedZone?.zone_id === zone.zone_id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-xs text-gray-700">{zone.label}</div>
                <div className="text-xl font-bold mt-1" style={{ color: getAQICategory(zone.aqi).color }}>{zone.aqi}</div>
                <div className="text-xs mt-1" style={{ color: getAQICategory(zone.aqi).color }}>{getAQICategory(zone.aqi).label}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedZone && (
          <>
            {/* Current AQI */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedZone.label}</h2>
                  <p className="text-gray-500 text-sm">Last updated: {new Date(selectedZone.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-bold" style={{ color: aqiCategory.color }}>{selectedZone.aqi}</div>
                  <div className="inline-block px-4 py-1 rounded-full text-sm font-semibold mt-2"
                    style={{ backgroundColor: aqiCategory.bgColor, color: aqiCategory.color }}>
                    {aqiCategory.label}
                  </div>
                </div>
              </div>

              {/* Pollutants Grid */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                {[
                  { label: 'PM2.5', value: selectedZone.pm2_5, unit: 'μg/m³' },
                  { label: 'PM10', value: selectedZone.pm10, unit: 'μg/m³' },
                  { label: 'NO₂', value: selectedZone.no2, unit: 'μg/m³' },
                  { label: 'SO₂', value: selectedZone.so2, unit: 'μg/m³' },
                  { label: 'CO', value: selectedZone.co, unit: 'mg/m³' },
                  { label: 'Ozone', value: selectedZone.ozone, unit: 'μg/m³' },
                  { label: 'NO', value: selectedZone.no, unit: 'μg/m³' },
                  { label: 'NOx', value: selectedZone.nox, unit: 'ppb' },
                  { label: 'NH₃', value: selectedZone.nh3, unit: 'μg/m³' },
                  { label: 'Benzene', value: selectedZone.benzene, unit: 'μg/m³' },
                  { label: 'Toluene', value: selectedZone.toluene, unit: 'μg/m³' },
                  { label: 'Xylene', value: selectedZone.xylene, unit: 'μg/m³' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-500 text-xs">{label}</div>
                    <div className="text-lg font-bold text-gray-900">{value?.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">{unit}</div>
                  </div>
                ))}
              </div>

              {/* Meteorology */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-600 mb-3">Meteorological Conditions</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Temp', value: `${selectedZone.temp}°C` },
                    { label: 'Humidity', value: `${selectedZone.humidity}%` },
                    { label: 'Wind Speed', value: `${selectedZone.wind_speed} m/s` },
                    { label: 'Wind Dir', value: `${selectedZone.wind_dir}°` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-blue-500 text-xs">{label}</div>
                      <div className="text-sm font-bold text-blue-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Health Alerts */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="text-red-600" size={24} />
                  <h2 className="text-xl font-semibold">Health Recommendations</h2>
                </div>
                <div className="space-y-3">
                  {getHealthRecommendations(selectedZone.aqi).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                      <p className="text-gray-700 text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 24h History */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold">24-Hour Trend</h2>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <YAxis />
                    <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                    <Legend />
                    <Line type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} dot={false} name="AQI" />
                    <Line type="monotone" dataKey="pm2_5" stroke="#ef4444" strokeWidth={1} dot={false} name="PM2.5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 7-Day Forecast */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-purple-600" size={24} />
                <h2 className="text-xl font-semibold">7-Day AQI Forecast</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="aqi" stroke="#8b5cf6" strokeWidth={2} name="Predicted AQI" />
                  <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} name="Confidence %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Safe Routes */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="text-green-600" size={24} />
                <h2 className="text-xl font-semibold">Safe Route Suggestions</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <div className="font-semibold text-green-800">Morning Jog</div>
                  <p className="text-sm text-gray-600 mt-2">Based on {selectedZone.label}</p>
                  <p className="text-xs text-green-700 mt-1">Best time: 6:00 AM - 7:30 AM</p>
                </div>
                <div className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="font-semibold text-yellow-800">Commute</div>
                  <p className="text-sm text-gray-600 mt-2">Use public transport when possible</p>
                  <p className="text-xs text-yellow-700 mt-1">30% less pollution exposure</p>
                </div>
                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <div className="font-semibold text-blue-800">Evening Walk</div>
                  <p className="text-sm text-gray-600 mt-2">Parks near {selectedZone.label}</p>
                  <p className="text-xs text-blue-700 mt-1">Best time: 5:00 PM - 6:30 PM</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
