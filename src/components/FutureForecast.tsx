import React, { useState } from 'react';
import { TrendingUp, Loader, FlaskConical } from 'lucide-react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

const BASE_URL = 'http://localhost:8000';

const STATIONS = [
  'Somajiguda', 'Kompally', 'IITH Kandi', 'ICRISAT Patancheru',
  'IDA Pashamylaram', 'Central University', 'Zoo Park',
];

const POLLUTANTS: Record<string, string> = {
  pm2_5: 'PM2.5 (μg/m³)', pm10: 'PM10 (μg/m³)',
  no2: 'NO₂ (μg/m³)',     so2: 'SO₂ (μg/m³)',
  co: 'CO (mg/m³)',        ozone: 'Ozone (μg/m³)',
};

const HORIZON_OPTIONS = [
  { label: '30 days',  value: 30 },
  { label: '90 days',  value: 90 },
  { label: '6 months', value: 180 },
  { label: '1 year',   value: 365 },
];

const FutureForecast: React.FC = () => {
  const [station,   setStation]   = useState('ICRISAT Patancheru');
  const [pollutant, setPollutant] = useState('pm2_5');
  const [days,      setDays]      = useState(90);
  const [result,    setResult]    = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${BASE_URL}/forecast/future`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station, pollutant, days }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError('Failed to connect to backend.');
    }
    setLoading(false);
  };

  const chartData = result?.data?.filter((d: any) => {
    if (d.is_future) return true;
    const cutoff = new Date(result.last_actual);
    cutoff.setMonth(cutoff.getMonth() - 6);
    return new Date(d.date) >= cutoff;
  });

  const futureStart = result?.last_actual;
  const futureRows = result?.data?.filter((d: any) => d.is_future) ?? [];
  const avgForecast = futureRows.length ? (futureRows.reduce((s: number, d: any) => s + d.forecast, 0) / futureRows.length).toFixed(1) : null;
  const maxForecast = futureRows.length ? Math.max(...futureRows.map((d: any) => d.forecast)).toFixed(1) : null;
  const minForecast = futureRows.length ? Math.min(...futureRows.map((d: any) => d.forecast)).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent mb-1">
            Future Pollution Forecast
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            XGBoost trains on 2017–2025 historical data and projects pollution levels forward
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Station</label>
              <select value={station} onChange={e => setStation(e.target.value)}
                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pollutant</label>
              <select value={pollutant} onChange={e => setPollutant(e.target.value)}
                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {Object.entries(POLLUTANTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Forecast Horizon</label>
              <div className="flex gap-2 flex-wrap">
                {HORIZON_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setDays(o.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      days === o.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <button onClick={handleRun} disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-700 shadow-sm">
                {loading ? <><Loader className="animate-spin" size={18} /><span>Forecasting...</span></> : <><FlaskConical size={18} /><span>Run Forecast</span></>}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-700 dark:text-red-400 mb-6">❌ {error}</div>}

        {result && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Training Data</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{result.train_days?.toLocaleString()}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">days of history</div>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-5">
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Avg Forecast</div>
                <div className="text-2xl font-bold text-blue-500">{avgForecast}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{POLLUTANTS[pollutant]}</div>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-orange-100 dark:border-orange-900/50 rounded-2xl p-5">
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Peak Forecast</div>
                <div className="text-2xl font-bold text-orange-500">{maxForecast}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">max in period</div>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-green-100 dark:border-green-900/50 rounded-2xl p-5">
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Min Forecast</div>
                <div className="text-2xl font-bold text-green-500">{minForecast}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">min in period</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-blue-500" size={22} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{POLLUTANTS[pollutant]} — {station}</h2>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                Showing last 6 months of actual data + {days}-day XGBoost forecast using lag features (R² ~0.8).
              </p>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.12)" />
                  <XAxis dataKey="date" tickFormatter={d => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; }} tick={{ fontSize: 11, fill: '#9ca3af' }} interval={Math.floor((chartData?.length || 1) / 10)} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} width={45} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', color: '#f9fafb' }} labelFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} formatter={(v: any, name: string | undefined) => [v != null ? Number(v).toFixed(2) : '—', name ?? '']} />
                  <Legend />
                  <Line type="monotone" dataKey="actual"   stroke="#94a3b8" strokeWidth={2} dot={false} connectNulls name="Actual" />
                  <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="6 3" name="XGBoost Forecast" />
                  {futureStart && <ReferenceLine x={futureStart} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Forecast starts', position: 'insideTopRight', fontSize: 11, fill: '#ef4444' }} />}
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1"><div className="w-6 h-0.5 bg-slate-400"></div><span>Actual readings</span></div>
                <div className="flex items-center gap-1"><div className="w-6 h-0.5 bg-blue-500"></div><span>XGBoost forecast</span></div>
                <div className="flex items-center gap-1"><div className="w-0.5 h-4 bg-red-400"></div><span>Forecast start</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FutureForecast;
