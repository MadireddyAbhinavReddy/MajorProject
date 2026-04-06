# Quick Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn

## Installation Steps

1. **Navigate to project directory**
```bash
cd delhi-pollution-dashboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Features Overview

### Navigation
Use the top navigation bar to switch between three main views:

1. **Citizen View** - For general public
   - Current AQI for multiple locations
   - Health recommendations
   - 7-day forecast
   - Safe route suggestions

2. **Policy Dashboard** - For policymakers
   - Pollution source breakdown
   - Intervention effectiveness analysis
   - AI-generated recommendations
   - Trend forecasting

3. **Map View** - Geographic visualization
   - Interactive map of Delhi-NCR
   - Color-coded AQI markers
   - Detailed location information

## Customization

### Adding New Locations
Edit `src/utils/mockData.ts` and add entries to `mockAQIData`:

```typescript
{
  location: 'Your Location',
  aqi: 250,
  pm25: 150,
  pm10: 200,
  no2: 60,
  so2: 20,
  co: 1.5,
  timestamp: new Date().toISOString(),
  lat: 28.xxxx,
  lng: 77.xxxx
}
```

### Modifying AQI Categories
Update the `getAQICategory` function in `src/utils/mockData.ts`

### Changing Color Schemes
Modify Tailwind classes in component files or update `tailwind.config.js`

## Troubleshooting

### Port Already in Use
If port 3000 is busy, the app will prompt to use another port, or you can specify:
```bash
PORT=3001 npm start
```

### Module Not Found Errors
Clear cache and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Map Not Displaying
Ensure leaflet CSS is imported in `MapView.tsx`:
```typescript
import 'leaflet/dist/leaflet.css';
```

## Production Build

To create an optimized production build:

```bash
npm run build
```

This creates a `build` folder with optimized files ready for deployment.

## Deployment Options

- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the `build` folder
- **GitHub Pages**: Use `gh-pages` package
- **AWS S3**: Upload build folder to S3 bucket

## Next Steps

1. Replace mock data with real API calls
2. Implement user authentication
3. Add backend for data persistence
4. Integrate ML models for forecasting
5. Build mobile app version
