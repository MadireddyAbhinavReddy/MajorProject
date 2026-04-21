import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import CitizenDashboard from './components/CitizenDashboard';
import PolicyDashboard from './components/PolicyDashboard';
import MapView from './components/MapView';
import Predictor from './components/Predictor';
import ForecastDashboard from './components/ForecastDashboard';
import FutureForecast from './components/FutureForecast';
import PolicyChat from './components/PolicyChat';
import { Users, Building2, Map, Brain, TrendingUp, Wind, ArrowLeft, MessageCircle, Telescope, Moon, Sun } from 'lucide-react';
import './App.css';

type ViewType = 'citizen' | 'policy' | 'map' | 'predictor' | 'forecast' | 'chat' | 'future';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeView, setActiveView]   = useState<ViewType>('citizen');
  const [dark, setDark]               = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <div className={`App min-h-screen ${dark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <nav className={`${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button onClick={() => setShowLanding(true)}
                className={`${dark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-800'} transition-colors mr-1`}>
                <ArrowLeft size={18} />
              </button>
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Wind size={18} className="text-white" />
              </div>
              <div>
                <h1 className={`text-base font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>ClarityAI</h1>
                <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Hyderabad Air Quality</p>
              </div>
            </div>

            {/* Nav items */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { view: 'citizen',   icon: Users,         label: 'Live Monitor' },
                { view: 'policy',    icon: Building2,     label: 'Policy Data' },
                { view: 'map',       icon: Map,           label: 'Map' },
                { view: 'forecast',  icon: TrendingUp,    label: 'Policy Impact' },
                { view: 'future',    icon: Telescope,     label: 'Future Forecast' },
                { view: 'predictor', icon: Brain,         label: 'AI Predictor' },
                { view: 'chat',      icon: MessageCircle, label: 'Policy Chat' },
              ] as { view: ViewType; icon: any; label: string }[]).map(({ view, icon: Icon, label }) => (
                <button key={view} onClick={() => setActiveView(view)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${
                    activeView === view
                      ? 'bg-blue-600 text-white shadow-sm'
                      : dark
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}

              {/* Dark mode toggle */}
              <button onClick={() => setDark(d => !d)}
                className={`ml-2 p-2 rounded-lg transition-all ${
                  dark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content — pass dark prop via CSS class on root */}
      <div className={dark ? 'dark' : ''}>
        {activeView === 'citizen'   && <CitizenDashboard />}
        {activeView === 'policy'    && <PolicyDashboard />}
        {activeView === 'map'       && <MapView />}
        {activeView === 'predictor' && <Predictor />}
        {activeView === 'forecast'  && <ForecastDashboard />}
        {activeView === 'future'    && <FutureForecast />}
        {activeView === 'chat'      && <PolicyChat />}
      </div>
    </div>
  );
}

export default App;
