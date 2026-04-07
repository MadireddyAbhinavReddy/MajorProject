import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, MapPin, Activity, Navigation, RefreshCw } from 'lucide-react';
import { getAQICategory } from '../utils/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BASE_URL = 'http://localhost:8000';
const POLL_INTERVAL = 2000; // poll every 2 seconds

const STATIONS = [
  { id: 'hyd-somajiguda-tspcb-2024-25',               label: 'Somajiguda' },
  { id: 'hyd-kompally-municipal-office-tspcb-2024-25', label: 'Kompally' },
  { id: 'hyd-iith-kandi-tspcb-2024-25',               label: 'IITH Kandi' },
  { id: 'hyd-icrisat-patancheru-tspcb-2024-25',        label: 'ICRISAT Patancheru' },
  { id: 'hyd-ida-pashamylaram-tspcb-2024-25',          label: 'IDA Pashamylaram' },
  { id: 'hyd-central-university-tspcb-2024-25',        label: 'Central University' },
  { id: 'hyd-zoo-park-tspcb-2024-25',                  label: 'Zoo Park' },
];

const CitizenDashboard: React.FC = () => {
  const [selectedId, setSelectedId]   = useState(STATIONS[0].id);
  const [stationData, setStationData] = useState<any>(null);
  const [history, setHistory]         = useState<any[]>([]);
  const [forecast, setForecast]       = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Background fetch — never shows loading spinner, just silently updates
  const fetchLatest = async (zoneId: string) => {
    try {
      const res  = await fetch(`${BASE_URL}/live/latest`);
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const match = data.find((z: any) => z.zone_id === zoneId);
      if (match) {
        setStationData(match);
        setLastUpdated(new Date());
      }
    } catch (_) {}
  };

  const fetchHistory = async (zoneId: string) => {
    try {
      const res  = await fetch(`${BASE_URL}/live/history?zone_id=${encodeURIComponent(zoneId)}&limit=200`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && !data[0]?.error) setHistory(data);
    } catch (_) {}
  };

  const fetchForecastData = async (zoneId: string) => {
    try {
      const res  = await fetch(`${BASE_URL}/forecast/${encodeURIComponent(zoneId)}`);
      const data = await res.json();
      if (Array.isArray(data)) setForecast(data);
    } catch (_) {}
  };

  // On station change: fetch everything once, then start polling latest
  useEffect(() => {
    fetchLatest(selectedId);
    fetchHistory(selectedId);
    fetchForecastData(selectedId);

    // Clear old interval and start new one
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchLatest(selectedId), POLL_INTERVAL);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedId]);

  const getHealthRecommendations = (aqi: number): string[] => {
    if (aqi > 300) return ['Avoid all outdoor activities', 'Keep windows closed, use air purifiers', 'Wear N95 masks if going outside', 'Consult a doctor if experiencing breathing issues'];
    if (aqi > 200) return ['Limit outdoor activities', 'Sensitive groups should stay indoors', 'Wear masks when outside'];
    if (aqi > 100) return ['Reduce prolonged outdoor exertion', 'Sensitive individuals take precautions'];
    return ['Air quality is acceptable', 'Enjoy outdoor activities'];
  };

  const aqiCategory  = stationData ? getAQICategory(stationData.aqi ?? 0) : getAQICategory(0);
  const stationLabel = STATIONS.find(s => s.id === selectedId)?.label ?? selectedId;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">India Air Quality Monitor</h1>
            <p className="text-gray-500 text-sm">
              {lastUpdated
                ? <>Live from Neon DB · Last updated: <span className="text-green-600 font-medium">{lastUpdated.toLocaleTimeString()}</span></>
                : 'Connecting to Neon DB...'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <RefreshCw size={14} className="animate-spin" />
            <span>Auto-refreshing every 2s</span>
          </div>
        </div>

        {/* Station Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Select Monitoring Station</h2>
          </div>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-base font-medium focus:border-blue-500 focus:outline-none mb-4"
          >
            {STATIONS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {STATIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedId === s.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-xs text-gray-700">{s.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Show last known data immediately, update silently in background */}
        {stationData ? (
          <>
            {/* AQI Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{stationLabel}</h2>
                  <p className="text-gray-500 text-sm">
                    Data timestamp: {stationData.timestamp ? new Date(stationData.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-bold" style={{ color: aqiCategory.color }}>{stationData.aqi}</div>
                  <div className="inline-block px-4 py-1 rounded-full text-sm font-semibold mt-2"
                    style={{ backgroundColor: aqiCategory.bgColor, color: aqiCategory.color }}>
                    {aqiCategory.label}
                  </div>
                </div>
              </div>

              {/* Pollutants */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                {[
                  { label: 'PM2.5',   value: stationData.pm2_5,   unit: 'μg/m³' },
                  { label: 'PM10',    value: stationData.pm10,    unit: 'μg/m³' },
                  { label: 'NO₂',    value: stationData.no2,     unit: 'μg/m³' },
                  { label: 'SO₂',    value: stationData.so2,     unit: 'μg/m³' },
                  { label: 'CO',     value: stationData.co,      unit: 'mg/m³' },
                  { label: 'Ozone',  value: stationData.ozone,   unit: 'μg/m³' },
                  { label: 'NO',     value: stationData.no,      unit: 'μg/m³' },
                  { label: 'NOx',    value: stationData.nox,     unit: 'ppb' },
                  { label: 'NH₃',   value: stationData.nh3,     unit: 'μg/m³' },
                  { label: 'Benzene',value: stationData.benzene, unit: 'μg/m³' },
                  { label: 'Toluene',value: stationData.toluene, unit: 'μg/m³' },
                  { label: 'Xylene', value: stationData.xylene,  unit: 'μg/m³' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-500 text-xs">{label}</div>
                    <div className="text-lg font-bold text-gray-900">{value != null ? Number(value).toFixed(2) : '—'}</div>
                    <div className="text-xs text-gray-400">{unit}</div>
                  </div>
                ))}
              </div>

              {/* Meteorology */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-600 mb-3">Meteorological Conditions</p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Temp',       value: stationData.temp,       unit: '°C' },
                    { label: 'Humidity',   value: stationData.humidity,   unit: '%' },
                    { label: 'Wind Speed', value: stationData.wind_speed, unit: 'm/s' },
                    { label: 'Wind Dir',   value: stationData.wind_dir,   unit: '°' },
                    { label: 'Solar Rad',  value: stationData.solar_rad,  unit: 'W/m²' },
                    { label: 'Rainfall',   value: stationData.rain_fall,  unit: 'mm' },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-blue-500 text-xs">{label}</div>
                      <div className="text-sm font-bold text-blue-900">
                        {value != null ? `${Number(value).toFixed(1)} ${unit}` : '—'}
                      </div>
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
                  {getHealthRecommendations(stationData.aqi ?? 0).map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                      <p className="text-gray-700 text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AQI Trend */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="text-blue-600" size={24} />
                  <h2 className="text-xl font-semibold">AQI Trend</h2>
                </div>
                {history.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                      <YAxis />
                      <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                      <Line type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={2} dot={false} name="AQI" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400 text-sm text-center py-10">No history data yet</p>}
              </div>
            </div>

            {/* Per-Pollutant Charts */}
            {history.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="text-gray-600" size={24} />
                  <h2 className="text-xl font-semibold text-gray-900">Pollutant Trends</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'pm2_5',   label: 'PM2.5',   unit: 'μg/m³', color: '#ef4444' },
                    { key: 'pm10',    label: 'PM10',    unit: 'μg/m³', color: '#f97316' },
                    { key: 'no2',     label: 'NO₂',    unit: 'μg/m³', color: '#eab308' },
                    { key: 'so2',     label: 'SO₂',    unit: 'μg/m³', color: '#84cc16' },
                    { key: 'co',      label: 'CO',      unit: 'mg/m³', color: '#06b6d4' },
                    { key: 'ozone',   label: 'Ozone',   unit: 'μg/m³', color: '#6366f1' },
                    { key: 'no',      label: 'NO',      unit: 'μg/m³', color: '#8b5cf6' },
                    { key: 'nox',     label: 'NOx',     unit: 'ppb',   color: '#ec4899' },
                    { key: 'nh3',     label: 'NH₃',    unit: 'μg/m³', color: '#14b8a6' },
                    { key: 'benzene', label: 'Benzene', unit: 'μg/m³', color: '#f43f5e' },
                    { key: 'toluene', label: 'Toluene', unit: 'μg/m³', color: '#a855f7' },
                    { key: 'xylene',  label: 'Xylene',  unit: 'μg/m³', color: '#0ea5e9' },
                  ].map(({ key, label, unit, color }) => (
                    <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                        <span className="text-xs text-gray-400">{unit}</span>
                      </div>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis tick={{ fontSize: 10 }} width={40} domain={["auto", "auto"]} />
                          <Tooltip
                            labelFormatter={(t) => new Date(t).toLocaleString()}
                            formatter={(v: any) => [Number(v).toFixed(2), label]}
                          />
                          <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>

                {/* Met charts */}
                <div className="flex items-center gap-2 mt-6 mb-4">
                  <Activity className="text-blue-500" size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">Meteorological Trends</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'temp',       label: 'Temperature', unit: '°C',   color: '#f97316' },
                    { key: 'humidity',   label: 'Humidity',    unit: '%',    color: '#06b6d4' },
                    { key: 'wind_speed', label: 'Wind Speed',  unit: 'm/s',  color: '#6366f1' },
                    { key: 'wind_dir',   label: 'Wind Dir',    unit: '°',    color: '#8b5cf6' },
                    { key: 'solar_rad',  label: 'Solar Rad',   unit: 'W/m²', color: '#eab308' },
                    { key: 'rain_fall',  label: 'Rainfall',    unit: 'mm',   color: '#3b82f6' },
                  ].map(({ key, label, unit, color }) => (
                    <div key={key} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                        <span className="text-xs text-gray-400">{unit}</span>
                      </div>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="timestamp"
                            tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis tick={{ fontSize: 10 }} width={40} domain={["auto", "auto"]} />
                          <Tooltip
                            labelFormatter={(t) => new Date(t).toLocaleString()}
                            formatter={(v: any) => [Number(v).toFixed(2), label]}
                          />
                          <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forecast */}
            {forecast.length > 0 && (
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
                    <Line type="monotone" dataKey="aqi"        stroke="#8b5cf6" strokeWidth={2} name="Predicted AQI" />
                    <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} name="Confidence %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Safe Routes */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="text-green-600" size={24} />
                <h2 className="text-xl font-semibold">Safe Route Suggestions</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <div className="font-semibold text-green-800">Morning Jog</div>
                  <p className="text-sm text-gray-600 mt-2">Based on {stationLabel}</p>
                  <p className="text-xs text-green-700 mt-1">Best time: 6:00 AM - 7:30 AM</p>
                </div>
                <div className="p-4 border-2 border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="font-semibold text-yellow-800">Commute</div>
                  <p className="text-sm text-gray-600 mt-2">Use public transport when possible</p>
                  <p className="text-xs text-yellow-700 mt-1">30% less pollution exposure</p>
                </div>
                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <div className="font-semibold text-blue-800">Evening Walk</div>
                  <p className="text-sm text-gray-600 mt-2">Parks near {stationLabel}</p>
                  <p className="text-xs text-blue-700 mt-1">Best time: 5:00 PM - 6:30 PM</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Only show this on very first load before any data arrives
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-400">
            <RefreshCw size={32} className="animate-spin mx-auto mb-3" />
            <p>Connecting to Neon DB...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
