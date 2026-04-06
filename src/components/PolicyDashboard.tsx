import React from 'react';
import { TrendingDown, BarChart3, Lightbulb, CheckCircle } from 'lucide-react';
import { pollutionSources, policyInterventions, forecastData } from '../utils/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

const PolicyDashboard: React.FC = () => {
  const aiRecommendations = [
    {
      priority: 'High',
      action: 'Implement emergency stubble burning control measures',
      impact: 'Expected 35% AQI reduction',
      timeline: 'Immediate (Oct-Nov)',
      color: 'red'
    },
    {
      priority: 'High',
      action: 'Expand metro network to reduce vehicular emissions',
      impact: 'Long-term 20-25% reduction',
      timeline: '2-3 years',
      color: 'red'
    },
    {
      priority: 'Medium',
      action: 'Enforce stricter industrial emission standards',
      impact: 'Expected 15% reduction',
      timeline: '6 months',
      color: 'yellow'
    },
    {
      priority: 'Medium',
      action: 'Implement construction dust control protocols',
      impact: 'Expected 10-12% reduction',
      timeline: '3 months',
      color: 'yellow'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Policy Dashboard</h1>
          <p className="text-gray-600">Data-driven insights for evidence-based interventions</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-sm mb-2">Current Avg AQI</div>
            <div className="text-3xl font-bold text-red-600">335</div>
            <div className="text-sm text-gray-500 mt-1">↑ 12% from last week</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-sm mb-2">Hazardous Days (Month)</div>
            <div className="text-3xl font-bold text-orange-600">18</div>
            <div className="text-sm text-gray-500 mt-1">Out of 27 days</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-sm mb-2">Active Interventions</div>
            <div className="text-3xl font-bold text-blue-600">3</div>
            <div className="text-sm text-gray-500 mt-1">2 showing positive impact</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-gray-600 text-sm mb-2">Predicted Trend</div>
            <div className="text-3xl font-bold text-green-600">↓ 8%</div>
            <div className="text-sm text-gray-500 mt-1">Next 7 days</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Source Contribution */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold">Pollution Source Breakdown</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pollutionSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${entry.contribution}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="contribution"
                >
                  {pollutionSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pollutionSources.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: source.color }}></div>
                    <span className="text-sm">{source.name}</span>
                  </div>
                  <span className="font-semibold">{source.contribution}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intervention Effectiveness */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold">Intervention Effectiveness</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={policyInterventions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="effectiveness" fill="#10b981" name="Effectiveness %" />
                <Bar dataKey="aqiReduction" fill="#3b82f6" name="AQI Reduction" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-yellow-600" size={24} />
            <h2 className="text-xl font-semibold">AI-Generated Recommendations</h2>
          </div>
          <div className="space-y-4">
            {aiRecommendations.map((rec, idx) => (
              <div key={idx} className={`p-4 border-l-4 rounded-lg ${
                rec.color === 'red' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        rec.color === 'red' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                      }`}>
                        {rec.priority} Priority
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{rec.action}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <span className="text-sm text-gray-600">Expected Impact:</span>
                        <p className="text-sm font-semibold text-gray-900">{rec.impact}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Timeline:</span>
                        <p className="text-sm font-semibold text-gray-900">{rec.timeline}</p>
                      </div>
                    </div>
                  </div>
                  <button className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Implement
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Trends */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-purple-600" size={24} />
            <h2 className="text-xl font-semibold">AQI Forecast & Trends</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="aqi" stroke="#8b5cf6" strokeWidth={2} name="Predicted AQI" />
              <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2} name="Confidence %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PolicyDashboard;
