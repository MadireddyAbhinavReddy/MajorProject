const BASE_URL = "http://localhost:8000";

export const fetchZones = async () => {
  const res = await fetch(`${BASE_URL}/zones`);
  return res.json();
};

export const fetchZoneLatest = async (zoneId: string) => {
  const res = await fetch(`${BASE_URL}/zone/${encodeURIComponent(zoneId)}/latest`);
  return res.json();
};

export const fetchZoneHistory = async (zoneId: string, hours = 24) => {
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
