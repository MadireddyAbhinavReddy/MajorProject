import React, { useState } from 'react';
import CitizenDashboard from './components/CitizenDashboard';
import PolicyDashboard from './components/PolicyDashboard';
import MapView from './components/MapView';
import Predictor from './components/Predictor';
import { Users, Building2, Map, Brain } from 'lucide-react';
import './App.css';

type ViewType = 'citizen' | 'policy' | 'map' | 'predictor';

function App() {
  const [activeView, setActiveView] = useState<ViewType>('citizen');

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">India Air Quality Monitor</h1>
                <p className="text-xs text-gray-500">AI-Driven Pollution Monitoring</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('citizen')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'citizen'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users size={20} />
                <span>Citizen View</span>
              </button>
              <button
                onClick={() => setActiveView('policy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'policy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building2 size={20} />
                <span>Policy Dashboard</span>
              </button>
              <button
                onClick={() => setActiveView('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Map size={20} />
                <span>Map View</span>
              </button>
              <button
                onClick={() => setActiveView('predictor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeView === 'predictor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Brain size={20} />
                <span>AI Predictor</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {activeView === 'citizen' && <CitizenDashboard />}
      {activeView === 'policy' && <PolicyDashboard />}
      {activeView === 'map' && <MapView />}
      {activeView === 'predictor' && <Predictor />}
    </div>
  );
}

export default App;
