import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Map } from 'lucide-react';
import { getAQICategory } from '../utils/mockData';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const MapView: React.FC = () => {
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
    L.Marker.prototype.options.icon = DefaultIcon;

    fetch('http://localhost:8000/live/latest')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && !data[0]?.error) {
          setZones(data);
        } else {
          return fetch('http://localhost:8000/api/realtime?city=Hyderabad')
            .then(r => r.json())
            .then(apiData => {
              const stations = apiData?.stations || [];
              const mapped = stations
                .filter((s: any) => s.latitude && s.longitude)
                .map((s: any) => ({
                  zone_id:   s.station,
                  label:     s.station?.replace(', Hyderabad - TSPCB', ''),
                  lat:       parseFloat(s.latitude),
                  lng:       parseFloat(s.longitude),
                  aqi:       s.aqi ?? 0,
                  pm2_5:     s['PM2.5'],
                  pm10:      s['PM10'],
                  no2:       s['NO2'],
                  so2:       s['SO2'],
                  co:        s['CO'],
                  ozone:     s['OZONE'],
                  no:        s['NO'],
                  nox:       s['NOx'],
                  nh3:       s['NH3'],
                  benzene:   s['Benzene'],
                  toluene:   s['Toluene'],
                  xylene:    s['Xylene'],
                  timestamp: s.last_update,
                }));
              if (mapped.length > 0) setZones(mapped);
            });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#080c12] text-gray-900 dark:text-white">
      <div className="border-b border-gray-200 dark:border-white/6 bg-white dark:bg-white/[0.02] px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Map size={20} className="text-blue-500" />
            Pollution Map
          </h1>
          <p className="text-gray-400 dark:text-white/35 text-xs mt-0.5">Real-time air quality monitoring across Hyderabad TSPCB stations</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.04] overflow-hidden">
          <div className="h-[600px]">
            <MapContainer center={[17.45, 78.35]} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {zones.map((zone) => {
                const category = getAQICategory(zone.aqi);
                return (
                  <CircleMarker
                    key={zone.zone_id}
                    center={[zone.lat, zone.lng]}
                    radius={20}
                    fillColor={category.color}
                    color="#fff"
                    weight={2}
                    opacity={1}
                    fillOpacity={0.7}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-base mb-2 border-b pb-2">{zone.label}</h3>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <strong>AQI:</strong>
                            <span className="font-bold px-2 py-0.5 rounded text-sm" style={{ color: category.color }}>
                              {zone.aqi}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <strong>Category:</strong>
                            <span style={{ color: category.color }}>{category.label}</span>
                          </div>
                          <hr className="my-1" />
                          <div className="text-sm space-y-1">
                            {[
                              ['PM2.5', zone.pm2_5, 'μg/m³'], ['PM10', zone.pm10, 'μg/m³'],
                              ['NO₂', zone.no2, 'μg/m³'],    ['SO₂', zone.so2, 'μg/m³'],
                              ['CO', zone.co, 'mg/m³'],       ['Ozone', zone.ozone, 'μg/m³'],
                              ['NO', zone.no, 'μg/m³'],       ['NOx', zone.nox, 'ppb'],
                              ['NH₃', zone.nh3, 'μg/m³'],    ['Benzene', zone.benzene, 'μg/m³'],
                              ['Toluene', zone.toluene, 'μg/m³'], ['Xylene', zone.xylene, 'μg/m³'],
                            ].filter(([, value]) => value != null && !isNaN(Number(value)))
                             .map(([label, value, unit]) => (
                              <div key={label as string} className="flex justify-between">
                                <span className="text-gray-600">{label}:</span>
                                <span className="font-semibold">{Number(value).toFixed(2)} {unit}</span>
                              </div>
                            ))}
                          </div>
                          <hr className="my-1" />
                          <p className="text-xs text-gray-400">Updated: {new Date(zone.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.04] px-6 py-4">
          <div className="flex flex-wrap gap-5 justify-center">
            {[
              { color: '#10b981', label: 'Good (0–50)' },
              { color: '#f59e0b', label: 'Moderate (51–100)' },
              { color: '#f97316', label: 'Unhealthy (101–200)' },
              { color: '#ef4444', label: 'Very Unhealthy (201–300)' },
              { color: '#7f1d1d', label: 'Hazardous (300+)' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-gray-600 dark:text-white/60 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
