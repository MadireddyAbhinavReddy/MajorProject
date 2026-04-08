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
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${BASE_URL}/forecast/policy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station, pollutant, policy_start: policyStart, policy_end: policyEnd }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (e) {
      setError('Failed to connect to backend.');
    }
    setLoading(false);
  };

  const impact = result?.impact;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Policy Impact Forecaster</h1>
          <p className="text-gray-500 text-sm">
            Train Prophet on pre-policy historical data → forecast what pollution would be without intervention → compare with real actual readings
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
              <select value={station} onChange={e => setStation(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pollutant</label>
              <select value={pollutant} onChange={e => setPollutant(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {Object.entries(POLLUTANT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Simulated Policy</label>
              <select value={policyIdx} onChange={e => setPolicyIdx(Number(e.target.value))}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {SIMULATED_POLICIES.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleRun} disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400">
                {loading
                  ? <><Loader className="animate-spin" size={18} /><span>Running...</span></>
                  : <><FlaskConical size={18} /><span>Run Forecast</span></>}
              </button>
            </div>
          </div>

          {/* Custom date range */}
          {selectedPolicy.label === 'Custom' && (
            <div className="grid md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Start</label>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy End</label>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          )}

          {!selectedPolicy.label.includes('Custom') && (
            <p className="text-xs text-gray-400 mt-2">
              Policy window: <span className="font-medium text-gray-600">{policyStart}</span> → <span className="font-medium text-gray-600">{policyEnd}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">❌ {error}</div>
        )}

        {result && result.train_rows < 180 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-yellow-800 text-sm">
            ⚠️ Only {result.train_rows} days of training data. Forecast accuracy improves significantly with multi-year data (2017–2024). The simulation shows a plausible trend but not a precise prediction.
          </div>
        )}

        {result && (
          <>
            {/* Impact Summary */}
            {impact && Object.keys(impact).length > 0 && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-5">
                  <div className="text-gray-500 text-xs mb-1">Avg Actual (policy period)</div>
                  <div className="text-2xl font-bold text-blue-600">{impact.avg_actual}</div>
                  <div className="text-xs text-gray-400">{POLLUTANT_LABELS[pollutant]}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-5">
                  <div className="text-gray-500 text-xs mb-1">Avg Forecast (no policy)</div>
                  <div className="text-2xl font-bold text-orange-500">{impact.avg_forecast}</div>
                  <div className="text-xs text-gray-400">{POLLUTANT_LABELS[pollutant]}</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-5">
                  <div className="text-gray-500 text-xs mb-1">Avg Reduction</div>
                  <div className={`text-2xl font-bold ${impact.avg_reduction > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {impact.avg_reduction > 0 ? '↓' : '↑'} {Math.abs(impact.avg_reduction)}
                  </div>
                  <div className="text-xs text-gray-400">{impact.reduction_pct}% change</div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-5 flex items-center gap-3">
                  {impact.policy_effective
                    ? <CheckCircle className="text-green-500" size={32} />
                    : <XCircle className="text-red-500" size={32} />}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {impact.policy_effective ? 'Policy Effective' : 'No Clear Effect'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {impact.policy_effective
                        ? 'Actual below forecast'
                        : 'Actual above or equal to forecast'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-purple-600" size={24} />
                <h2 className="text-xl font-semibold">
                  {POLLUTANT_LABELS[pollutant]} — Actual vs Forecast
                </h2>
                <span className="text-sm text-gray-400 ml-2">({station})</span>
              </div>

              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={result.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={d => {
                      const dt = new Date(d);
                      return `${dt.getMonth()+1}/${dt.getDate()}`;
                    }}
                    tick={{ fontSize: 11 }}
                    interval={6}
                  />
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} width={45} />
                  <Tooltip
                    labelFormatter={d => new Date(d).toLocaleDateString()}
                    formatter={(v: any, name: string | undefined) => [
                      v != null ? Number(v).toFixed(2) : '—',
                      name ?? ''
                    ]}
                  />
                  <Legend />

                  {/* Confidence band */}
                  <Area
                    type="monotone"
                    dataKey="forecast_high"
                    fill="#e9d5ff"
                    stroke="none"
                    name="Forecast Upper"
                    legendType="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast_low"
                    fill="#ffffff"
                    stroke="none"
                    name="Forecast Lower"
                    legendType="none"
                  />

                  {/* Forecast line */}
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="6 3"
                    name="Forecast (no policy)"
                  />

                  {/* Actual line */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                    name="Actual"
                  />

                  {/* Policy window shading */}
                  <ReferenceArea
                    x1={policyStart}
                    x2={policyEnd}
                    fill="#fef08a"
                    fillOpacity={0.4}
                    label={{ value: 'Policy Period', position: 'insideTop', fontSize: 11, fill: '#92400e' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-0.5 bg-blue-500"></div>
                  <span>Actual readings</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-0.5 bg-purple-500 border-dashed border-t-2"></div>
                  <span>Prophet forecast (what would have been without policy)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-200 rounded"></div>
                  <span>Policy intervention window</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-purple-100 rounded"></div>
                  <span>95% confidence interval</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForecastDashboard;
