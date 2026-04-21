const BASE_URL = "http://localhost:8000";

export const fetchZones = async () => {
  try {
    const res  = await fetch(`${BASE_URL}/live/latest`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && !data[0]?.error) return data;
  } catch (_) {}
  return [];
};

export const fetchZoneLatest = async (zoneId: string) => {
  const res = await fetch(`${BASE_URL}/zone/${encodeURIComponent(zoneId)}/latest`);
  return res.json();
};

export const fetchZoneHistory = async (zoneId: string, hours = 24) => {
  // Try live history first
  try {
    const res = await fetch(`${BASE_URL}/live/history?zone_id=${encodeURIComponent(zoneId)}&limit=200`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && !data[0]?.error) return data;
  } catch (_) {}
  const res = await fetch(`${BASE_URL}/zone/${encodeURIComponent(zoneId)}/history?hours=${hours}`);
  return res.json();
};

export const fetchForecast = async (zoneId: string) => {
  const res = await fetch(`${BASE_URL}/forecast/${encodeURIComponent(zoneId)}`);
  return res.json();
};

export const fetchSummary = async () => {
  const res = await fetch(`${BASE_URL}/summary`);
  return res.json();
};
