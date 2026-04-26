import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Activity, Navigation, RefreshCw, Radio, Wifi, Wind, Droplets, Thermometer, Sun, CloudRain, ChevronRight } from 'lucide-react';
import { getAQICategory } from '../utils/mockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BASE_URL = 'http://localhost:8000';
const POLL_INTERVAL = 2000;

const STATIONS = [
  { id: 'hyd-somajiguda-tspcb-2024-25',               label: 'Somajiguda',         lat: 17.4239, lng: 78.4738 },
  { id: 'hyd-kompally-municipal-office-tspcb-2024-25', label: 'Kompally',           lat: 17.5406, lng: 78.4867 },
  { id: 'hyd-iith-kandi-tspcb-2024-25',               label: 'IITH Kandi',         lat: 17.5936, lng: 78.1320 },
  { id: 'hyd-icrisat-patancheru-tspcb-2024-25',        label: 'ICRISAT Patancheru', lat: 17.5169, lng: 78.2674 },
  { id: 'hyd-ida-pashamylaram-tspcb-2024-25',          label: 'IDA Pashamylaram',   lat: 17.5169, lng: 78.2674 },
  { id: 'hyd-central-university-tspcb-2024-25',        label: 'Central University', lat: 17.4586, lng: 78.3318 },
  { id: 'hyd-zoo-park-tspcb-2024-25',                  label: 'Zoo Park',           lat: 17.3616, lng: 78.4513 },
];

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestStation(userLat: number, userLng: number) {
  return STATIONS.reduce((best, s) => {
    const d = haversine(userLat, userLng, s.lat, s.lng);
    return d < haversine(userLat, userLng, best.lat, best.lng) ? s : best;
  });
}

const AQI_GRADIENT: Record<string, string> = {
  Good:           'from-emerald-400 to-green-500',
  Moderate:       'from-yellow-400 to-amber-500',
  Unhealthy:      'from-orange-400 to-orange-600',
  'Very Unhealthy':'from-red-500 to-red-700',
  Hazardous:      'from-rose-700 to-red-900',
};

// ── API Data View ─────────────────────────────────────────────────────────────
const ApiDataView: React.FC = () => {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/realtime?city=Hyderabad&limit=500`)
      .then(r => r.json())
      .then(d => { setApiData(d); setLoading(false); })
      .catch(() => { setError('Failed to fetch API data'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Fetching from data.gov.in...</p>
    </div>
  );

  if (error || apiData?.error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 flex items-center gap-3">
      <AlertCircle size={20} />
      <span>{error || apiData?.error}</span>
    </div>
  );

  const stations = apiData?.stations || [];
  const pollutants = stations.length > 0
    ? Object.keys(stations[0]).filter(k => !['station','city','state','latitude','longitude','last_update','aqi'].includes(k))
    : [];

  return (
    <div>
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 mb-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Wifi size={20} />
          </div>
          <div>
            <div className="font-bold text-lg">data.gov.in — Live AQI</div>
            <div className="text-emerald-100 text-sm">
              {apiData?.total_stations} stations · Updated: <strong>{apiData?.last_update}</strong>
              {apiData?.cached_at && <span className="opacity-70 ml-2">· cached {apiData.cached_at}</span>}
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-emerald-100">
          <div>Refreshes every 10 min</div>
          <div className="opacity-70">Source: CPCB</div>
        </div>
      </div>

      {/* Station grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stations.map((s: any, i: number) => {
          const aqiCat = s.aqi ? getAQICategory(s.aqi) : null;
          const grad   = aqiCat ? AQI_GRADIENT[aqiCat.label] || 'from-gray-400 to-gray-500' : 'from-gray-300 to-gray-400';
          return (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
              {/* Station header with AQI */}
              <div className={`bg-gradient-to-r ${grad} p-4 flex items-center justify-between`}>
                <div>
                  <div className="font-bold text-white text-sm leading-tight">{s.station?.replace(', Hyderabad - TSPCB','')}</div>
                  <div className="text-white/70 text-xs mt-0.5">{s.city}</div>
                </div>
                {s.aqi ? (
                  <div className="text-right">
                    <div className="text-3xl font-black text-white">{s.aqi}</div>
                    <div className="text-white/80 text-xs font-medium">{aqiCat?.label}</div>
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">No AQI</div>
                )}
              </div>
              {/* Pollutants */}
              <div className="p-4 grid grid-cols-3 gap-2">
                {pollutants.filter(p => s[p] != null).map(p => (
                  <div key={p} className="text-center">
                    <div className="text-xs text-gray-400 font-medium">{p}</div>
                    <div className="text-sm font-bold text-gray-800">{s[p]}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-3 text-xs text-gray-400 flex items-center gap-1">
                <RefreshCw size={10} />
                {s.last_update}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const CitizenDashboard: React.FC = () => {
  const [selectedId, setSelectedId]   = useState(STATIONS[0].id);
  const [stationData, setStationData] = useState<any>(null);
  const [history, setHistory]         = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataSource, setDataSource]   = useState<'live' | 'api'>('live');
  const [geoLoading, setGeoLoading]   = useState(false);
  const [geoError, setGeoError]       = useState<string | null>(null);
  const [nearestDist, setNearestDist] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLatest = async (zoneId: string) => {
    try {
      const res  = await fetch(`${BASE_URL}/live/latest`);
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const match = data.find((z: any) => z.zone_id === zoneId);
      if (match) { setStationData(match); setLastUpdated(new Date()); }
    } catch (_) {}
  };

  const fetchHistory = async (zoneId: string) => {
    try {
      const res  = await fetch(`${BASE_URL}/live/history?zone_id=${encodeURIComponent(zoneId)}&limit=200`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && !data[0]?.error) setHistory(data);
    } catch (_) {}
  };

  const fetchForecastData = async (_zoneId: string) => {
    // forecast data unused — kept for future use
  };

  useEffect(() => {
    fetchLatest(selectedId);
    fetchHistory(selectedId);
    fetchForecastData(selectedId);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchLatest(selectedId), POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedId]);

  const getHealthRecommendations = (aqi: number) => {
    if (aqi > 300) return ['Avoid all outdoor activities', 'Keep windows closed, use air purifiers', 'Wear N95 masks if going outside', 'Consult a doctor if experiencing breathing issues'];
    if (aqi > 200) return ['Limit outdoor activities', 'Sensitive groups should stay indoors', 'Wear masks when outside'];
    if (aqi > 100) return ['Reduce prolonged outdoor exertion', 'Sensitive individuals take precautions'];
    return ['Air quality is acceptable', 'Enjoy outdoor activities'];
  };

  const aqiCategory  = stationData ? getAQICategory(stationData.aqi ?? 0) : getAQICategory(0);
  const stationLabel = STATIONS.find(s => s.id === selectedId)?.label ?? selectedId;
  const grad         = AQI_GRADIENT[aqiCategory.label] || 'from-gray-400 to-gray-500';

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = nearestStation(latitude, longitude);
        const dist = haversine(latitude, longitude, nearest.lat, nearest.lng);
        setSelectedId(nearest.id);
        setNearestDist(Math.round(dist * 10) / 10);
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.code === 1 ? 'Location access denied.' : 'Could not get your location.');
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Top hero bar */}
      <div className="bg-gray-900 text-white px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Air Quality Monitor</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {lastUpdated
                ? <>Live · <span className="text-green-400">{lastUpdated.toLocaleTimeString()}</span></>
                : 'Connecting...'}
            </p>
          </div>

          {/* Source toggle */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1 self-start sm:self-auto">
            <button onClick={() => setDataSource('live')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dataSource === 'live' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              <Radio size={14} /> Live Stream
            </button>
            <button onClick={() => setDataSource('api')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dataSource === 'api' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              <Wifi size={14} /> API Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

        {/* API View */}
        {dataSource === 'api' && <ApiDataView />}

        {/* Live View */}
        {dataSource === 'live' && <>

          {/* Station selector */}
          <div className="flex gap-2 flex-wrap mb-6 items-center">
            {STATIONS.map(s => (
              <button key={s.id} onClick={() => { setSelectedId(s.id); setNearestDist(null); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  selectedId === s.id
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                }`}>
                {s.label}
              </button>
            ))}

            {/* Locate me button */}
            <button
              onClick={handleLocate}
              disabled={geoLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 border-dashed border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all disabled:opacity-50"
            >
              {geoLoading
                ? <><RefreshCw size={14} className="animate-spin" /> Locating...</>
                : <><Navigation size={14} /> Nearest to me</>}
            </button>
          </div>

          {/* Geo feedback */}
          {nearestDist !== null && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300 w-fit">
              <Navigation size={14} />
              Nearest station: <strong>{stationLabel}</strong> — {nearestDist} km away
            </div>
          )}
          {geoError && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 w-fit">
              <AlertCircle size={14} /> {geoError}
            </div>
          )}

          {stationData ? (
            <div className="space-y-5">

              {/* AQI Hero Card */}
              <div className={`bg-gradient-to-br ${grad} rounded-3xl p-6 text-white relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="text-white/70 text-sm font-medium mb-1">{stationLabel}</div>
                    <div className="text-7xl font-black leading-none">{stationData.aqi}</div>
                    <div className="text-white/90 text-xl font-semibold mt-2">{aqiCategory.label}</div>
                    <div className="text-white/60 text-xs mt-1">
                      {stationData.timestamp ? new Date(stationData.timestamp).toLocaleString() : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                      <RefreshCw size={12} className="animate-spin" /> Auto-refreshing
                    </div>
                    <div className="text-white/60 text-xs">Every 2 seconds</div>
                  </div>
                </div>

                {/* AQI scale bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-white/60 text-xs mb-1">
                    <span>0</span><span>Good</span><span>Moderate</span><span>Unhealthy</span><span>500</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stationData.aqi / 500) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* Pollutants grid */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Pollutants</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'PM2.5',   value: stationData.pm2_5,   unit: 'μg/m³', color: 'bg-red-50 border-red-100 text-red-700' },
                    { label: 'PM10',    value: stationData.pm10,    unit: 'μg/m³', color: 'bg-orange-50 border-orange-100 text-orange-700' },
                    { label: 'NO₂',    value: stationData.no2,     unit: 'μg/m³', color: 'bg-yellow-50 border-yellow-100 text-yellow-700' },
                    { label: 'SO₂',    value: stationData.so2,     unit: 'μg/m³', color: 'bg-lime-50 border-lime-100 text-lime-700' },
                    { label: 'CO',     value: stationData.co,      unit: 'mg/m³', color: 'bg-cyan-50 border-cyan-100 text-cyan-700' },
                    { label: 'Ozone',  value: stationData.ozone,   unit: 'μg/m³', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
                    { label: 'NO',     value: stationData.no,      unit: 'μg/m³', color: 'bg-purple-50 border-purple-100 text-purple-700' },
                    { label: 'NOx',    value: stationData.nox,     unit: 'ppb',   color: 'bg-pink-50 border-pink-100 text-pink-700' },
                    { label: 'NH₃',   value: stationData.nh3,     unit: 'μg/m³', color: 'bg-teal-50 border-teal-100 text-teal-700' },
                    { label: 'Benzene',value: stationData.benzene, unit: 'μg/m³', color: 'bg-rose-50 border-rose-100 text-rose-700' },
                    { label: 'Toluene',value: stationData.toluene, unit: 'μg/m³', color: 'bg-violet-50 border-violet-100 text-violet-700' },
                    { label: 'Xylene', value: stationData.xylene,  unit: 'μg/m³', color: 'bg-sky-50 border-sky-100 text-sky-700' },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} className={`border rounded-2xl p-3 ${color}`}>
                      <div className="text-xs font-medium opacity-70">{label}</div>
                      <div className="text-xl font-bold mt-0.5">{value != null ? Number(value).toFixed(1) : '—'}</div>
                      <div className="text-xs opacity-60">{unit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Met conditions */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Meteorology</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Temperature', value: stationData.temp,       unit: '°C',   icon: Thermometer, color: 'text-orange-500' },
                    { label: 'Humidity',    value: stationData.humidity,   unit: '%',    icon: Droplets,    color: 'text-blue-500' },
                    { label: 'Wind Speed',  value: stationData.wind_speed, unit: 'm/s',  icon: Wind,        color: 'text-indigo-500' },
                    { label: 'Wind Dir',    value: stationData.wind_dir,   unit: '°',    icon: Navigation,  color: 'text-purple-500' },
                    { label: 'Solar Rad',   value: stationData.solar_rad,  unit: 'W/m²', icon: Sun,         color: 'text-yellow-500' },
                    { label: 'Rainfall',    value: stationData.rain_fall,  unit: 'mm',   icon: CloudRain,   color: 'text-cyan-500' },
                  ].map(({ label, value, unit, icon: Icon, color }) => (
                    <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <Icon size={20} className={color} />
                      <div>
                        <div className="text-xs text-gray-400">{label}</div>
                        <div className="font-bold text-gray-900 dark:text-white">
                          {value != null ? `${Number(value).toFixed(1)} ${unit}` : '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts row */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* Health */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={18} className="text-red-500" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Health Recommendations</h2>
                  </div>
                  <div className="space-y-2">
                    {getHealthRecommendations(stationData.aqi ?? 0).map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                        <ChevronRight size={14} className="text-red-400 mt-0.5 shrink-0" />
                        <p className="text-gray-700 text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-blue-500" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">Recent Trend</h2>
                  </div>
                  {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={['auto','auto']} />
                        <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
                        <Legend />
                        <Line type="monotone" dataKey="aqi"   stroke="#3b82f6" strokeWidth={2} dot={false} name="AQI" />
                        <Line type="monotone" dataKey="pm2_5" stroke="#ef4444" strokeWidth={1.5} dot={false} name="PM2.5" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-sm text-center py-10">No history data yet</p>}
                </div>
              </div>

              {/* Per-pollutant trend charts */}
              {history.length > 0 && (() => {
                const POLLUTANT_LINES = [
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
                ];
                // Only show pollutants that have at least some data
                const available = POLLUTANT_LINES.filter(p =>
                  history.some((h: any) => h[p.key] != null && !isNaN(Number(h[p.key])))
                );
                if (available.length === 0) return null;
                return (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Pollutant Trends</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {available.map(({ key, label, unit, color }) => {
                        // Compute tight domain with 10% padding
                        const vals = history.map((h: any) => Number(h[key])).filter((v: number) => !isNaN(v));
                        const min = Math.min(...vals);
                        const max = Math.max(...vals);
                        const pad = (max - min) * 0.1 || 1;
                        const domain: [number, number] = [
                          parseFloat((min - pad).toFixed(2)),
                          parseFloat((max + pad).toFixed(2)),
                        ];
                        return (
                          <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold dark:text-gray-100" style={{ color }}>{label}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{unit}</span>
                            </div>
                            <ResponsiveContainer width="100%" height={120}>
                              <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.12)" />
                                <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tick={{ fontSize: 9, fill: '#9ca3af' }} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} width={38} domain={domain} />
                                <Tooltip
                                  contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '8px', color: '#f9fafb', fontSize: '11px' }}
                                  labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                                  formatter={(v: any) => [v != null ? Number(v).toFixed(2) : '—', `${label} (${unit})`]}
                                />
                                <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} connectNulls />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Safe routes */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Navigation size={18} className="text-green-500" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">Safe Route Suggestions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { title: 'Morning Jog', desc: `Best near ${stationLabel}`, time: '6:00 – 7:30 AM', color: 'border-l-4 border-green-400 bg-green-50' },
                    { title: 'Commute',     desc: 'Use public transport',       time: '30% less exposure', color: 'border-l-4 border-yellow-400 bg-yellow-50' },
                    { title: 'Evening Walk',desc: `Parks near ${stationLabel}`, time: '5:00 – 6:30 PM',   color: 'border-l-4 border-blue-400 bg-blue-50' },
                  ].map(({ title, desc, time, color }) => (
                    <div key={title} className={`${color} rounded-xl p-4`}>
                      <div className="font-semibold text-gray-800 text-sm">{title}</div>
                      <div className="text-gray-600 text-xs mt-1">{desc}</div>
                      <div className="text-gray-500 text-xs mt-1 font-medium">{time}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500">Connecting to Neon DB...</p>
            </div>
          )}
        </>}
      </div>
    </div>
  );
};

export default CitizenDashboard;
