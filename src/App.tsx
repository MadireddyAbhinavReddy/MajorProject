import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import CitizenDashboard from './components/CitizenDashboard';
import PolicyDashboard from './components/PolicyDashboard';
import MapView from './components/MapView';
import Predictor from './components/Predictor';
import ForecastDashboard from './components/ForecastDashboard';
import PolicyChat from './components/PolicyChat';
import { Users, Building2, Map, Brain, TrendingUp, Wind, ArrowLeft, MessageCircle } from 'lucide-react';
import './App.css';

type ViewType = 'citizen' | 'policy' | 'map' | 'predictor' | 'forecast' | 'chat';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeView, setActiveView]   = useState<ViewType>('citizen');

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className="App">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowLanding(true)} className="text-gray-500 hover:text-gray-800 transition-colors mr-1">
                <ArrowLeft size={18} />
              </button>
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wind size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ClarityAI</h1>
                <p className="text-xs text-gray-500">Hyderabad Air Quality</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {([
                { view: 'citizen',   icon: Users,          label: 'Live Monitor' },
                { view: 'policy',    icon: Building2,      label: 'Policy Data' },
                { view: 'map',       icon: Map,            label: 'Map' },
                { view: 'forecast',  icon: TrendingUp,     label: 'Forecast' },
                { view: 'predictor', icon: Brain,          label: 'AI Predictor' },
                { view: 'chat',      icon: MessageCircle,  label: 'Policy Chat' },
              ] as { view: ViewType; icon: any; label: string }[]).map(({ view, icon: Icon, label }) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                    activeView === view ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {activeView === 'citizen'   && <CitizenDashboard />}
      {activeView === 'policy'    && <PolicyDashboard />}
      {activeView === 'map'       && <MapView />}
      {activeView === 'predictor' && <Predictor />}
      {activeView === 'forecast'  && <ForecastDashboard />}
      {activeView === 'chat'      && <PolicyChat />}
    </div>
  );
}

export default App;
