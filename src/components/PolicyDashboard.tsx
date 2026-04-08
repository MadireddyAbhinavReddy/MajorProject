import React, { useState, useEffect } from 'react';
import { BarChart3, Loader, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const BASE_URL = 'http://localhost:8000';

const POLLUTANT_CHARTS = [
  { key: 'pm2_5',   label: 'PM2.5',    unit: 'μg/m³', color: '#ef4444' },
  { key: 'pm10',    label: 'PM10',     unit: 'μg/m³', color: '#f97316' },
  { key: 'no2',     label: 'NO₂',     unit: 'μg/m³', color: '#eab308' },
  { key: 'so2',     label: 'SO₂',     unit: 'μg/m³', color: '#84cc16' },
  { key: 'co',      label: 'CO',       unit: 'mg/m³', color: '#06b6d4' },
  { key: 'ozone',   label: 'Ozone',    unit: 'μg/m³', color: '#6366f1' },
  { key: 'no',      label: 'NO',       unit: 'μg/m³', color: '#8b5cf6' },
  { key: 'nox',     label: 'NOx',      unit: 'ppb',   color: '#ec4899' },
  { key: 'nh3',     label: 'NH₃',     unit: 'μg/m³', color: '#14b8a6' },
  { key: 'benzene', label: 'Benzene',  unit: 'μg/m³', color: '#f43f5e' },
  { key: 'toluene', label: 'Toluene',  unit: 'μg/m³', color: '#a855f7' },
  { key: 'xylene',  label: 'Xylene',   unit: 'μg/m³', color: '#0ea5e9' },
];

const MET_CHARTS = [
  { key: 'temp',       label: 'Temperature', unit: '°C',   color: '#f97316' },
  { key: 'humidity',   label: 'Humidity',    unit: '%',    color: '#06b6d4' },
  { key: 'wind_speed', label: 'Wind Speed',  unit: 'm/s',  color: '#6366f1' },
  { key: 'solar_rad',  label: 'Solar Rad',   unit: 'W/m²', color: '#eab308' },
  { key: 'rain_fall',  label: 'Rainfall',    unit: 'mm',   color: '#3b82f6' },
];

const RESAMPLE_OPTIONS = [
  { value: '1D',  label: 'Daily' },
  { value: '1W',  label: 'Weekly' },
  { value: '1ME', label: 'Monthly' },
];

const PollutantChart: React.FC<{
  data: any[]; dataKey: string; label: string; unit: string; color: string;
}> = ({ data, dataKey, label, unit, color }) => {
  const [highlighted, setHighlighted] = useState(false);

  return (
    <div
      onClick={() => setHighlighted(h => !h)}
      className={`rounded-lg border shadow-sm p-4 cursor-pointer transition-all ${
        highlighted
          ? 'border-2 shadow-lg scale-[1.02]'
          : 'bg-white border-gray-100 hover:border-gray-300'
      }`}
      style={highlighted ? { borderColor: color, backgroundColor: `${color}10` } : {}}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold" style={{ color: highlighted ? color : '#374151' }}>{label}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(t) => {
              const d = new Date(t);
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              return months[d.getMonth()];
            }}
            tick={{ fontSize: 9 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 9 }} width={38} domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={(t) => {
              const d = new Date(t);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }}
            formatter={(v: any) => [v != null ? Number(v).toFixed(2) : '—', label]}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={highlighted ? 3 : 2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const PolicyDashboard: React.FC = () => {
  const [coreStations, setCoreStations]   = useState<string[]>([]);
  const [extraStations, setExtraStations] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [resample, setResample]           = useState('1D');
  const [data, setData]                   = useState<any[]>([]);
  const [loading, setLoading]             = useState(false);
  const [showExtra, setShowExtra]         = useState(false);
  const [activeTab, setActiveTab]         = useState<'annual' | 'trends'>('annual');
  const [trendsData, setTrendsData]       = useState<any[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Load station list
  useEffect(() => {
    fetch(`${BASE_URL}/policy/stations`)
      .then(r => r.json())
      .then(d => {
        setCoreStations(d.core);
        setExtraStations(d.extra);
        setSelectedStation(d.core[0]);
      });
  }, []);

  // Load annual data
  useEffect(() => {
    if (!selectedStation) return;
    setLoading(true);
    fetch(`${BASE_URL}/policy/data?station=${encodeURIComponent(selectedStation)}&resample=${resample}`)
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedStation, resample]);

  // Load multi-year trends
  useEffect(() => {
    if (!selectedStation || activeTab !== 'trends') return;
    setTrendsLoading(true);
    fetch(`${BASE_URL}/trends/data?station=${encodeURIComponent(selectedStation)}&resample=1ME`)
      .then(r => r.json())
      .then(d => { setTrendsData(Array.isArray(d) ? d : []); setTrendsLoading(false); })
      .catch(() => setTrendsLoading(false));
  }, [selectedStation, activeTab]);

  const allStations = showExtra ? [...coreStations, ...extraStations] : [...coreStations];

  // Summary stats
  const avg = (key: string) => {
    const vals = data.map(d => d[key]).filter(v => v != null && !isNaN(v));
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  };
  const max = (key: string) => {
    const vals = data.map(d => d[key]).filter(v => v != null && !isNaN(v));
    return vals.length ? Math.max(...vals).toFixed(1) : '—';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Policy Dashboard</h1>
          <p className="text-gray-500 text-sm">2025 annual pollution data — Hyderabad TSPCB stations</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Station selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
              <select
                value={selectedStation}
                onChange={e => setSelectedStation(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {coreStations.length > 0 && (
                  <optgroup label="Core Stations">
                    {coreStations.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                )}
                {showExtra && extraStations.length > 0 && (
                  <optgroup label="Additional Stations">
                    {extraStations.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Resample */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aggregation</label>
              <div className="flex gap-2">
                {RESAMPLE_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setResample(o.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      resample === o.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle extra stations */}
            <button
              onClick={() => setShowExtra(p => !p)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              {showExtra ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showExtra ? 'Hide' : 'Show'} additional stations ({extraStations.length})
            </button>
          </div>

          {/* Station quick-select chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {allStations.map(s => (
              <button
                key={s}
                onClick={() => setSelectedStation(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedStation === s
                    ? 'bg-blue-600 text-white'
                    : extraStations.includes(s)
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-blue-600 mr-3" size={32} />
            <span className="text-gray-600">Loading 2025 data...</span>
          </div>
        ) : data.length > 0 ? (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Avg PM2.5', value: avg('pm2_5'), unit: 'μg/m³', color: 'red' },
                { label: 'Max PM2.5', value: max('pm2_5'), unit: 'μg/m³', color: 'red' },
                { label: 'Avg NO₂',  value: avg('no2'),   unit: 'μg/m³', color: 'yellow' },
                { label: 'Avg Ozone',value: avg('ozone'), unit: 'μg/m³', color: 'indigo' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="bg-white rounded-lg shadow-md p-4">
                  <div className="text-gray-500 text-xs mb-1">{label}</div>
                  <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
                  <div className="text-gray-400 text-xs">{unit}</div>
                </div>
              ))}
            </div>

            {/* Pollutant charts */}
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="text-gray-600" size={22} />
              <h2 className="text-xl font-semibold text-gray-900">Pollutant Trends — {selectedStation} (2025)</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {POLLUTANT_CHARTS.map(c => (
                <PollutantChart key={c.key} data={data} dataKey={c.key} label={c.label} unit={c.unit} color={c.color} />
              ))}
            </div>

            {/* Met charts */}
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={22} />
              <h2 className="text-xl font-semibold text-gray-900">Meteorological Trends — {selectedStation} (2025)</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MET_CHARTS.map(c => (
                <PollutantChart key={c.key} data={data} dataKey={c.key} label={c.label} unit={c.unit} color={c.color} />
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-400">
            No data available for this station.
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicyDashboard;
