# Frontend Configuration

## API Base URL Configuration

The frontend API base URL is now centralized in a single location for easy management.

### How to Change the API URL

**File:** `src/config.ts`

Simply update the `API_BASE_URL` constant:

```typescript
export const API_BASE_URL = 'http://localhost:8000';
```

### Examples

**Local Development:**
```typescript
export const API_BASE_URL = 'http://localhost:8000';
```

**Production:**
```typescript
export const API_BASE_URL = 'https://api.yourproduction.com';
```

**Using Environment Variables:**
```typescript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

Then create a `.env` file in the project root:
```
REACT_APP_API_URL=https://api.yourproduction.com
```

### Files Updated

All API calls in the following files now use the centralized config:

- `src/utils/api.ts`
- `src/components/LandingPage.tsx`
- `src/components/PolicyDashboard.tsx`
- `src/components/MapView.tsx`
- `src/components/FutureForecast.tsx`
- `src/components/CitizenDashboard.tsx`
- `src/components/Predictor.tsx`
- `src/components/ForecastDashboard.tsx`
- `src/components/PolicyChat.tsx`

### Benefits

✅ **Single source of truth** - Change the URL in one place  
✅ **Environment-specific configs** - Easy to switch between dev/staging/prod  
✅ **Type-safe** - TypeScript ensures consistent usage  
✅ **Easy maintenance** - No need to search through multiple files
