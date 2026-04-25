import React, { useState } from 'react';
import { TrendingUp, Loader, FlaskConical, CheckCircle, XCircle } from 'lucide-react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceArea
} from 'recharts';

const BASE_URL = 'http://localhost:8000';

const POLLUTANT_LABELS: Record<string, string> = {
  pm2_5: 'PM2.5 (μg/m³)', pm10: 'PM10 (μg/m³)',
  no2: 'NO₂ (μg/m³)',     so2: 'SO₂ (μg/m³)',
  co: 'CO (mg/m³)',        ozone: 'Ozone (μg/m³)',
};

const SIMULATED_POLICIES = [
  { label: 'COVID Lockdown — India (Mar-Jun 2020)',  start: '2020-03-25', end: '2020-06-30' },
  { label: 'COVID Lockdown Phase 1 (Mar-Apr 2020)',  start: '2020-03-25', end: '2020-04-14' },
  { label: 'Post-Lockdown Recovery (Jul-Dec 2020)',  start: '2020-07-01', end: '2020-12-31' },
  { label: 'Odd-Even Scheme (Oct 2019)',             start: '2019-10-04', end: '2019-10-15' },
  { label: 'Custom',                                 start: '',           end: '' },
];

const ForecastDashboard: React.FC = () => {
  const [station,     setStation]     = useState('ICRISAT Patancheru');
  const [pollutant,   setPollutant]   = useState('pm2_5');
  const [policyIdx,   setPolicyIdx]   = useState(0);
  const [customStart, setCustomStart] = useState('2025-03-01');
  const [customEnd,   setCustomEnd]   = useState('2025-04-30');
  const [result,      setResult]      = useState<any>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const selectedPolicy = SIMULATED_POLICIES[policyIdx];
  const policyStart = selectedPolicy.label === 'Custom' ? customStart : selectedPolicy.start;
  const policyEnd   = selectedPolicy.label === 'Custom' ? customEnd   : selectedPolicy.end;
  const STATIONS = ['Somajiguda','Kompally','IITH Kandi','ICRISAT Patancheru','IDA Pashamylaram','Central University','Zoo Park'];

  const handleRun = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${BASE_URL}/forecast/policy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station, pollutant, policy_start: policyStart, policy_end: policyEnd }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch { setError('Failed to connect to backend.'); }
    setLoading(false);
  };

  const impact = result?.impact;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-400 bg-clip-text text-transparent mb-1">
            Policy Impact Forecaster
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Train Prophet on pre-policy historical data → forecast what pollution would be without intervention → compare with real actual readings
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                {Object.entries(POLLUTANT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Simulated Policy</label>
              <select value={policyIdx} onChange={e => setPolicyIdx(Number(e.target.value))}
                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {SIMULATED_POLICIES.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleRun} disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-700 shadow-sm">
                {loading ? <><Loader className="animate-spin" size={18} /><span>Running...</span></> : <><FlaskConical size={18} /><span>Run Forecast</span></>}
              </button>
            </div>
          </div>

          {selectedPolicy.label === 'Custom' && (
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Start</label>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy End</label>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>
          )}

          {!selectedPolicy.label.includes('Custom') && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Policy window: <span className="font-medium text-gray-600 dark:text-gray-300">{policyStart}</span> → <span className="font-medium text-gray-600 dark:text-gray-300">{policyEnd}</span>
            </p>
          )}
        </div>

        {error && <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-700 dark:text-red-400 mb-6">❌ {error}</div>}

        {result && result.train_rows < 180 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-3 mb-4 text-yellow-800 dark:text-yellow-400 text-sm">
            ⚠️ Only {result.train_rows} days of training data. Forecast accuracy improves with multi-year data.
          </div>
        )}

        {result && (
          <>
            {impact && Object.keys(impact).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-5">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Avg Actual (policy period)</div>
                  <div className="text-2xl font-bold text-blue-500">{impact.avg_actual}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{POLLUTANT_LABELS[pollutant]}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-orange-100 dark:border-orange-900/50 rounded-2xl p-5">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Avg Forecast (no policy)</div>
                  <div className="text-2xl font-bold text-orange-500">{impact.avg_forecast}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{POLLUTANT_LABELS[pollutant]}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-green-100 dark:border-green-900/50 rounded-2xl p-5">
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Avg Reduction</div>
                  <div className={`text-2xl font-bold ${impact.avg_reduction > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {impact.avg_reduction > 0 ? '↓' : '↑'} {Math.abs(impact.avg_reduction)}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{impact.reduction_pct}% change</div>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-3">
                  {impact.policy_effective ? <CheckCircle className="text-green-500" size={32} /> : <XCircle className="text-red-500" size={32} />}
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{impact.policy_effective ? 'Policy Effective' : 'No Clear Effect'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{impact.policy_effective ? 'Actual below forecast' : 'Actual above or equal to forecast'}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-purple-500" size={24} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{POLLUTANT_LABELS[pollutant]} — Actual vs Forecast</h2>
                <span className="text-sm text-gray-400 dark:text-gray-500 ml-2">({station})</span>
              </div>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={result.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156,163,175,0.12)" />
                  <XAxis dataKey="date" tickFormatter={d => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; }} tick={{ fontSize: 11, fill: '#9ca3af' }} interval={6} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} domain={['auto', 'auto']} width={45} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', color: '#f9fafb' }} labelFormatter={d => new Date(d).toLocaleDateString()} formatter={(v: any, name: string | undefined) => [v != null ? Number(v).toFixed(2) : '—', name ?? '']} />
                  <Legend />
                  <Area type="monotone" dataKey="forecast_high" fill="#7c3aed33" stroke="none" name="Forecast Upper" legendType="none" />
                  <Area type="monotone" dataKey="forecast_low"  fill="#111827"   stroke="none" name="Forecast Lower" legendType="none" />
                  <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={2} dot={false} strokeDasharray="6 3" name="Forecast (no policy)" />
                  <Line type="monotone" dataKey="actual"   stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls name="Actual" />
                  <ReferenceArea x1={policyStart} x2={policyEnd} fill="#fef08a" fillOpacity={0.25} label={{ value: 'Policy Period', position: 'insideTop', fontSize: 11, fill: '#92400e' }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1"><div className="w-6 h-0.5 bg-blue-500"></div><span>Actual readings</span></div>
                <div className="flex items-center gap-1"><div className="w-6 h-0.5 bg-purple-500"></div><span>Prophet forecast</span></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-900/50 rounded"></div><span>Policy window</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastDashboard;
