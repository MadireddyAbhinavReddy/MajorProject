import React, { useState, useEffect } from 'react';
import { Wind, BarChart3, Map, Brain, TrendingUp, ChevronRight, Activity, Shield } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const AQI_COLORS: Record<string, string> = {
  Good: '#10b981', Moderate: '#f59e0b', Unhealthy: '#f97316',
  'Very Unhealthy': '#ef4444', Hazardous: '#7f1d1d',
};

const getAQILabel = (aqi: number) => {
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const FEATURES = [
  { icon: Activity,   title: 'Live AQI Monitor',     desc: 'Real-time pollution data from 7 Hyderabad TSPCB stations streamed every second.',       view: 'citizen' },
  { icon: BarChart3,  title: 'Policy Dashboard',      desc: '2025 annual trends for all pollutants across 14 stations with daily/weekly/monthly views.', view: 'policy' },
  { icon: Map,        title: 'Interactive Map',       desc: 'Geographic visualization of pollution hotspots across Hyderabad with full pollutant details.', view: 'map' },
  { icon: TrendingUp, title: 'Policy Impact Forecast',desc: 'Prophet-based forecasting to measure real impact of interventions like COVID lockdown.', view: 'forecast' },
  { icon: Brain,      title: 'AI Predictor',          desc: 'TabPFN in-context learning to predict any pollutant value given time and known inputs.', view: 'predictor' },
  { icon: Shield,     title: 'Health Alerts',         desc: 'Personalized health recommendations and safe route suggestions based on current AQI.', view: 'citizen' },
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [liveAQI, setLiveAQI] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/live/latest')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const avg = Math.round(data.reduce((s, z) => s + (z.aqi || 0), 0) / data.length);
          setLiveAQI(avg);
        }
      }).catch(() => {});

    const t = setInterval(() => {}, 3000);
    return () => clearInterval(t);
  }, []);

  const aqiLabel = liveAQI ? getAQILabel(liveAQI) : null;
  const aqiColor = aqiLabel ? AQI_COLORS[aqiLabel] : '#6b7280';

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wind size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg">ClarityAI</span>
          </div>
          <button
            onClick={onEnter}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            Open Dashboard <ChevronRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Live data streaming from Hyderabad TSPCB
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            AI-Driven Pollution
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Source Identification
            </span>
          </h1>

          <p className="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
            Real-time AQI monitoring, policy impact forecasting, and AI-powered insights for Hyderabad — built for citizens and policymakers.
          </p>

          {/* Live AQI badge */}
          {liveAQI && (
            <div className="inline-flex items-center gap-4 px-6 py-4 bg-gray-900 border border-gray-700 rounded-2xl mb-10">
              <div>
                <div className="text-gray-400 text-xs mb-1">Current Avg AQI · Hyderabad</div>
                <div className="text-4xl font-bold" style={{ color: aqiColor }}>{liveAQI}</div>
              </div>
              <div className="w-px h-12 bg-gray-700" />
              <div>
                <div className="text-gray-400 text-xs mb-1">Status</div>
                <div className="text-lg font-semibold" style={{ color: aqiColor }}>{aqiLabel}</div>
              </div>
              <div className="w-px h-12 bg-gray-700" />
              <div>
                <div className="text-gray-400 text-xs mb-1">Stations</div>
                <div className="text-lg font-semibold text-white">7 Live</div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onEnter}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              Open Dashboard <ChevronRight size={20} />
            </button>
            <button
              onClick={onEnter}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl font-semibold text-lg transition-colors"
            >
              View Policy Forecast
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '14',    label: 'Monitoring Stations' },
            { value: '8.4M',  label: 'Data Points' },
            { value: '9',     label: 'Years of History' },
            { value: '7',     label: 'Pollutants Tracked' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-blue-400 mb-1">{value}</div>
              <div className="text-gray-400 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-gray-400 max-w-xl mx-auto">From live monitoring to AI-powered policy analysis — one platform for citizens and decision makers.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, view }) => (
              <button
                key={title}
                onClick={onEnter}
                className="text-left p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500/50 hover:bg-gray-800/50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600/30 transition-colors">
                  <Icon size={24} className="text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1 mt-4 text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section className="py-16 px-6 bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-6">Data Sources</p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400 text-sm font-medium">
            {['TSPCB (Telangana PCB)', 'CPCB National Network', 'data.gov.in API', 'Neon PostgreSQL', 'Prophet Forecasting', 'TabPFN AI'].map(s => (
              <span key={s} className="px-4 py-2 bg-gray-800 rounded-lg">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to explore?</h2>
          <p className="text-gray-400 mb-8">Real-time data, AI forecasts, and policy insights — all in one place.</p>
          <button
            onClick={onEnter}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-lg transition-colors inline-flex items-center gap-2"
          >
            Launch Dashboard <ChevronRight size={20} />
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-sm">
        ClarityAI — AI-Driven Pollution Source Identification, Forecasting & Policy Dashboard · Hyderabad-NCR
      </footer>
    </div>
  );
};

export default LandingPage;
