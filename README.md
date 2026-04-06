# Delhi-NCR Air Quality Monitoring Platform

An AI-driven pollution source identification, forecasting, and policy dashboard for Delhi-NCR region.

## Features

### 🏙️ Citizen Dashboard
- **Real-time AQI Monitoring**: View current air quality index for multiple locations across Delhi-NCR
- **Hyperlocal Data**: Location-specific pollution data including PM2.5, PM10, NO₂, SO₂, and CO levels
- **Health Alerts**: Personalized health recommendations based on current AQI levels
- **7-Day Forecast**: AI-powered short-term air quality predictions
- **Safe Route Suggestions**: Recommendations for less polluted routes for jogging, commuting, and outdoor activities

### 🏛️ Policy Dashboard
- **Source Identification**: Breakdown of pollution sources (stubble burning, vehicular emissions, industrial activity, etc.)
- **Intervention Effectiveness**: Track the impact of policy measures like odd-even schemes, construction bans, and firecracker restrictions
- **AI Recommendations**: Data-driven suggestions for targeted interventions with expected impact and timelines
- **Trend Analysis**: Seasonal and long-term pollution trend visualization
- **Key Metrics**: Real-time statistics on hazardous days, active interventions, and predicted trends

### 🗺️ Interactive Map View
- **Geographic Visualization**: Real-time pollution levels across Delhi-NCR on an interactive map
- **Color-coded Markers**: Easy-to-understand visual representation of AQI categories
- **Detailed Popups**: Click on any location for detailed pollutant information

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **UI Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **Maps**: Leaflet & React-Leaflet for interactive maps
- **Icons**: Lucide React

## Installation

1. Navigate to the project directory:
```bash
cd delhi-pollution-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
delhi-pollution-dashboard/
├── src/
│   ├── components/
│   │   ├── CitizenDashboard.tsx    # Citizen-facing features
│   │   ├── PolicyDashboard.tsx     # Policy maker analytics
│   │   └── MapView.tsx             # Interactive map view
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── utils/
│   │   └── mockData.ts             # Sample data and utilities
│   ├── App.tsx                     # Main application component
│   └── index.tsx                   # Application entry point
├── public/
└── package.json
```

## Data Sources (For Production Implementation)

The current implementation uses mock data. For production, integrate:

- **Satellite Data**: NASA MODIS, ISRO satellite imagery
- **Ground Sensors**: CPCB (Central Pollution Control Board) monitoring stations
- **IoT Sensors**: Real-time sensor network data
- **Meteorological Data**: Weather patterns and wind direction
- **Traffic Data**: Real-time traffic congestion information
- **Industrial Activity**: Emission data from industrial zones

## AI/ML Integration (Recommended)

For production deployment, consider implementing:

1. **Time Series Forecasting**: LSTM/GRU models for AQI prediction
2. **Source Attribution**: ML models to trace pollution back to specific sources
3. **Anomaly Detection**: Identify unusual pollution spikes
4. **Recommendation Engine**: AI-powered policy intervention suggestions
5. **Image Analysis**: Satellite imagery analysis for stubble burning detection

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Push notifications for health alerts
- [ ] User authentication and personalized profiles
- [ ] Historical data analysis and trends
- [ ] Integration with wearable devices
- [ ] Multi-language support
- [ ] Offline mode with cached data
- [ ] Social sharing features
- [ ] Community reporting of pollution sources

## API Integration

To connect with real data sources, update the mock data functions in `src/utils/mockData.ts` with actual API calls:

```typescript
// Example API integration
const fetchAQIData = async () => {
  const response = await fetch('YOUR_API_ENDPOINT');
  return response.json();
};
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Contact

For questions or support, please open an issue in the repository.

---

Built with ❤️ for cleaner air in Delhi-NCR
