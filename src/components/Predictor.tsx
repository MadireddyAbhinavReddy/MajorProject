import React, { useState } from 'react';
import { Brain, Loader, FlaskConical } from 'lucide-react';

const ZONES = [
  { id: 'hyd-somajiguda-tspcb-2024-25',               label: 'Somajiguda' },
  { id: 'hyd-kompally-municipal-office-tspcb-2024-25', label: 'Kompally' },
  { id: 'hyd-iith-kandi-tspcb-2024-25',               label: 'IITH Kandi' },
  { id: 'hyd-icrisat-patancheru-tspcb-2024-25',        label: 'ICRISAT Patancheru' },
  { id: 'hyd-ida-pashamylaram-tspcb-2024-25',          label: 'IDA Pashamylaram' },
  { id: 'hyd-central-university-tspcb-2024-25',        label: 'Central University' },
  { id: 'hyd-zoo-park-tspcb-2024-25',                  label: 'Zoo Park' },
];

const POLLUTANTS = ['pm2_5','pm10','no2','so2','co','ozone','no','nox','nh3','benzene','toluene','xylene'];
const MET_COLS   = ['temp','humidity','wind_speed','wind_dir','solar_rad','rain_fall'];
const ALL_COLS   = [...POLLUTANTS, ...MET_COLS];

const Predictor: React.FC = () => {
  const [zone,      setZone]      = useState(ZONES[0].id);
  const [timestamp, setTimestamp] = useState('2025-01-10 14:00:00');
  const [target,    setTarget]    = useState('pm10');
  const [known,     setKnown]     = useState<Record<string, string>>({});
  const [result,    setResult]    = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleKnownChange = (col: string, val: string) => {
    setKnown(prev => ({ ...prev, [col]: val }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const knownNumeric: Record<string, number> = {};
      for (const [k, v] of Object.entries(known)) {
        if (v !== '') knownNumeric[k] = parseFloat(v);
      }
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp, zone_id: zone, target, known: knownNumeric }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (e) {
      setError('Failed to connect to backend.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AQI Predictor</h1>
          <p className="text-gray-600">
            Enter a timestamp and any known values — TabPFN will predict the target pollutant.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="text-purple-600" size={24} />
            <h2 className="text-xl font-semibold">Prediction Inputs</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {/* Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <select
                value={zone}
                onChange={e => setZone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {ZONES.map(z => (
                  <option key={z.id} value={z.id}>{z.label}</option>
                ))}
              </select>
            </div>

            {/* Timestamp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
              <input
                type="text"
                value={timestamp}
                onChange={e => setTimestamp(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM:SS"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Predict (target)</label>
              <select
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {ALL_COLS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Known values */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Known Values <span className="text-gray-400 font-normal">(leave blank if unknown)</span>
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {ALL_COLS.filter(c => c !== target).map(col => (
                <div key={col}>
                  <label className="block text-xs text-gray-500 mb-1">{col}</label>
                  <input
                    type="number"
                    step="any"
                    value={known[col] ?? ''}
                    onChange={e => handleKnownChange(col, e.target.value)}
                    placeholder="—"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            {loading
              ? <><Loader className="animate-spin" size={20} /><span>Predicting...</span></>
              : <><FlaskConical size={20} /><span>Run Prediction</span></>
            }
          </button>
        </div>

        {/* Result */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold">Prediction Result</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-purple-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 text-sm mb-1">Predicted {result.target}</p>
                <p className="text-5xl font-bold text-purple-700">{result.predicted_value}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {POLLUTANTS.includes(result.target) ? 'μg/m³' : ''}
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Zone</span>
                  <span className="font-semibold">{ZONES.find(z => z.id === result.zone_id)?.label}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Timestamp</span>
                  <span className="font-semibold">{result.timestamp}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Training rows used</span>
                  <span className="font-semibold">{result.training_rows?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Features used</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.features_used?.map((f: string) => (
                      <span key={f} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictor;
