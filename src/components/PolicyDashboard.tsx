import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Loader, ChevronDown, ChevronUp, TrendingUp, X } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
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
  { value: '1D', label: 'Daily' },
  { value: '1W', label: 'Weekly' },
  { value: 'M',  label: 'Monthly' },
];

// ── Full-screen modal chart ───────────────────────────────────────────────────
const ChartModal: React.FC<{
  data: any[]; dataKey: string; label: string; unit: string; color: string;
  onClose: () => void;
}> = ({ data, dataKey, label, unit, color, onClose }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const filtered = useMemo(() => {
    if (!dateFrom && !dateTo) return data;
    return data.filter(d => {
      const t = d.timestamp;
      if (dateFrom && t < dateFrom) return false;
      if (dateTo   && t > dateTo)   return false;
      return true;
    });
  }, [data, dateFrom, dateTo]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{label}</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500">{unit}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Date range:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-blue-500 hover:underline"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{filtered.length} data points</span>
        </div>

        {/* Full chart */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.15)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => {
                const d = new Date(t);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} width={45} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#f9fafb' }}
              labelFormatter={(t) => new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              formatter={(v: any) => [v != null ? Number(v).toFixed(2) : '—', `${label} (${unit})`]}
            />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} name={label} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ── Small card chart ──────────────────────────────────────────────────────────
const PollutantChart: React.FC<{
  data: any[]; dataKey: string; label: string; unit: string; color: string;
}> = ({ data, dataKey, label, unit, color }) => {
  const [highlighted, setHighlighted] = useState(false);
  const [fullscreen,  setFullscreen]  = useState(false);

  // Check if all values are null/undefined
  const hasData = data.some(d => d[dataKey] != null && !isNaN(Number(d[dataKey])));

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 flex flex-col items-center justify-center" style={{ minHeight: 180 }}>
        <span className="text-sm font-semibold text-gray-400 dark:text-gray-600 mb-1">{label}</span>
        <span className="text-xs text-gray-300 dark:text-gray-700">Not available</span>
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setHighlighted(h => !h)}
        onDoubleClick={() => setFullscreen(true)}
        className={`rounded-2xl border p-4 cursor-pointer transition-all relative ${
          highlighted
            ? 'border-2 shadow-lg scale-[1.02]'
            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm'
        }`}
        style={highlighted ? { borderColor: color, backgroundColor: `${color}15` } : {}}
        title="Double-click to expand"
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold dark:text-gray-100" style={{ color: highlighted ? color : undefined }}>{label}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{unit}</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.12)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(t) => {
                const d = new Date(t);
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return months[d.getMonth()];
              }}
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} width={38} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '10px', color: '#f9fafb', fontSize: '12px' }}
              labelFormatter={(t) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              formatter={(v: any) => [v != null ? Number(v).toFixed(2) : '—', label]}
            />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={highlighted ? 3 : 2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {fullscreen && (
        <ChartModal
          data={data} dataKey={dataKey} label={label} unit={unit} color={color}
          onClose={() => setFullscreen(false)}
        />
      )}
    </>
  );
};

const PolicyDashboard: React.FC = () => {
  const [coreStations, setCoreStations]   = useState<string[]>([]);
  const [extraStations, setExtraStations] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [resample, setResample]           = useState('1D');
  const [selectedYear, setSelectedYear]   = useState(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([2025]);
  const [customFrom, setCustomFrom]       = useState('');
  const [customTo, setCustomTo]           = useState('');
  const [showCustom, setShowCustom]       = useState(false);
  const [dataMinDate, setDataMinDate]     = useState('');
  const [dataMaxDate, setDataMaxDate]     = useState('');
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
        // Default to ICRISAT Patancheru — has data from 2017 onwards
        const preferred = 'ICRISAT Patancheru';
        setSelectedStation(d.core.includes(preferred) ? preferred : d.core[0]);
      });
  }, []);

  // Load available years + actual data date range when station changes
  useEffect(() => {
    if (!selectedStation) return;
    fetch(`${BASE_URL}/policy/years?station=${encodeURIComponent(selectedStation)}`)
      .then(r => r.json())
      .then(years => {
        if (Array.isArray(years) && years.length > 0) {
          setAvailableYears(years);
          setSelectedYear(years[0]);
        }
      });
    fetch(`${BASE_URL}/policy/daterange?station=${encodeURIComponent(selectedStation)}`)
      .then(r => r.json())
      .then(d => {
        if (d.min) setDataMinDate(d.min);
        if (d.max) setDataMaxDate(d.max);
      });
  }, [selectedStation]);

  // Load data — uses year selector OR custom range
  useEffect(() => {
    if (!selectedStation) return;

    if (showCustom && (customFrom || customTo)) {
      // Custom range → use trends endpoint with date filter (works across years)
      setLoading(true);
      const params = new URLSearchParams({ station: selectedStation, resample: resample === '1D' ? '1D' : resample });
      if (customFrom) params.set('date_from', customFrom);
      if (customTo)   params.set('date_to',   customTo);
      fetch(`${BASE_URL}/trends/data?${params}`)
        .then(r => r.json())
        .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    } else if (!showCustom) {
      // Year selector → use annual endpoint
      setLoading(true);
      fetch(`${BASE_URL}/policy/data?station=${encodeURIComponent(selectedStation)}&resample=${resample}&year=${selectedYear}`)
        .then(r => r.json())
        .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [selectedStation, resample, selectedYear, showCustom, customFrom, customTo]);

  // Load multi-year trends tab
  useEffect(() => {
    if (!selectedStation || activeTab !== 'trends') return;
    setTrendsLoading(true);
    const params = new URLSearchParams({ station: selectedStation, resample: 'MS' });
    if (showCustom && customFrom) params.set('date_from', customFrom);
    if (showCustom && customTo)   params.set('date_to',   customTo);
    fetch(`${BASE_URL}/trends/data?${params}`)
      .then(r => r.json())
      .then(d => { setTrendsData(Array.isArray(d) ? d : []); setTrendsLoading(false); })
      .catch(() => setTrendsLoading(false));
  }, [selectedStation, activeTab, showCustom, customFrom, customTo]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent mb-1">
            Policy Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Annual pollution data — Hyderabad TSPCB stations</p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Station selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Station</label>
              <select
                value={selectedStation}
                onChange={e => setSelectedStation(e.target.value)}
                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aggregation</label>
              <div className="flex gap-2">
                {RESAMPLE_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setResample(o.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      resample === o.value
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Year selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <div className="flex flex-wrap gap-2">
                {availableYears.map(y => (
                  <button
                    key={y}
                    onClick={() => { setSelectedYear(y); setShowCustom(false); }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      selectedYear === y && !showCustom
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {y}
                  </button>
                ))}
                <button
                  onClick={() => setShowCustom(p => !p)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors border-2 border-dashed ${
                    showCustom
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'
                  }`}
                >
                  Custom Range
                </button>
              </div>
              {showCustom && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">From</span>
                  <input
                    type="date"
                    value={customFrom}
                    min={dataMinDate || undefined}
                    max={customTo || dataMaxDate || '2025-12-31'}
                    onChange={e => setCustomFrom(e.target.value)}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-gray-400">→</span>
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom || dataMinDate || undefined}
                    max={dataMaxDate || '2025-12-31'}
                    onChange={e => setCustomTo(e.target.value)}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  {dataMinDate && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                      Data available: {dataMinDate} → {dataMaxDate}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Toggle extra stations */}
            <button
              onClick={() => setShowExtra(p => !p)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
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
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('annual')}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'annual'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400'
            }`}
          >
            Annual Data
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'trends'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400'
            }`}
          >
            <TrendingUp size={16} />
            7-Year Trends (2017–2025)
          </button>
        </div>

        {/* Annual tab */}
        {activeTab === 'annual' && (loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-blue-500 mr-3" size={32} />
            <span className="text-gray-500 dark:text-gray-400">Loading data...</span>
          </div>
        ) : data.length > 0 ? (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Avg PM2.5', value: avg('pm2_5'), unit: 'μg/m³', accent: 'from-red-500 to-rose-400', border: 'border-red-500/20 dark:border-red-500/30', bg: 'bg-red-50 dark:bg-red-950/20' },
                { label: 'Max PM2.5', value: max('pm2_5'), unit: 'μg/m³', accent: 'from-orange-500 to-amber-400', border: 'border-orange-500/20 dark:border-orange-500/30', bg: 'bg-orange-50 dark:bg-orange-950/20' },
                { label: 'Avg NO₂',  value: avg('no2'),   unit: 'μg/m³', accent: 'from-yellow-500 to-amber-400', border: 'border-yellow-500/20 dark:border-yellow-500/30', bg: 'bg-yellow-50 dark:bg-yellow-950/20' },
                { label: 'Avg Ozone',value: avg('ozone'), unit: 'μg/m³', accent: 'from-indigo-500 to-violet-400', border: 'border-indigo-500/20 dark:border-indigo-500/30', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
              ].map(({ label, value, unit, accent, border, bg }) => (
                <div key={label} className={`rounded-2xl border ${border} ${bg} p-4`}>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</div>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>{value}</div>
                  <div className="text-gray-400 dark:text-gray-500 text-xs">{unit}</div>
                </div>
              ))}
            </div>

            {/* Pollutant charts */}
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-500" size={22} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pollutant Trends — {selectedStation} ({showCustom && customFrom ? `${customFrom} → ${customTo || 'now'}` : selectedYear})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[...POLLUTANT_CHARTS].sort((a, b) => {
                const aHas = data.some(d => d[a.key] != null && !isNaN(Number(d[a.key])));
                const bHas = data.some(d => d[b.key] != null && !isNaN(Number(d[b.key])));
                return aHas === bHas ? 0 : aHas ? -1 : 1;
              }).map(c => (
                <PollutantChart key={c.key} data={data} dataKey={c.key} label={c.label} unit={c.unit} color={c.color} />
              ))}
            </div>

            {/* Met charts */}
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="text-cyan-500" size={22} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Meteorological Trends — {selectedStation} ({showCustom && customFrom ? `${customFrom} → ${customTo || 'now'}` : selectedYear})
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MET_CHARTS.map(c => (
                <PollutantChart key={c.key} data={data} dataKey={c.key} label={c.label} unit={c.unit} color={c.color} />
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center text-gray-400 dark:text-gray-600">
            No data available for this station.
          </div>
        ))}

        {/* 7-Year Trends tab */}
        {activeTab === 'trends' && (trendsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-blue-500 mr-3" size={32} />
            <span className="text-gray-500 dark:text-gray-400">Loading 7-year data (2017–2025)...</span>
          </div>
        ) : trendsData.length > 0 ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={22} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Pollutant Trends 2017–2025 — {selectedStation}
              </h2>
              <span className="text-sm text-gray-400 dark:text-gray-500 ml-2">(monthly averages)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[...POLLUTANT_CHARTS].sort((a, b) => {
                const aHas = trendsData.some(d => d[a.key] != null && !isNaN(Number(d[a.key])));
                const bHas = trendsData.some(d => d[b.key] != null && !isNaN(Number(d[b.key])));
                return aHas === bHas ? 0 : aHas ? -1 : 1;
              }).map(c => (
                <PollutantChart key={c.key} data={trendsData} dataKey={c.key} label={c.label} unit={c.unit} color={c.color} />
              ))}
            </div>
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="text-cyan-500" size={22} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Meteorological Trends 2017–2025</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MET_CHARTS.map(c => (
                <PollutantChart key={c.key} data={trendsData} dataKey={c.key} label={c.label} unit={c.unit} color={c.color} />
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-12 text-center text-gray-400 dark:text-gray-600">
            No multi-year data available for this station.
          </div>
        ))}
      </div>
    </div>
  );
};

export default PolicyDashboard;
