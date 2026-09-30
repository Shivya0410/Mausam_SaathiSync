// aviationweather.gov METAR and TAF (PRD 12.2.5). Free public US NOAA
// service; cached 10 minutes. This is airport weather, not flight status.

import { fetchUpstream } from '../http.js';
import { decodeMetar, tafSummary } from './decode.js';

const BASE = () => (process.env.AVIATION_WEATHER_BASE_URL || 'https://aviationweather.gov/api/data').replace(/\/$/, '');

export async function fetchAirports(icaos) {
  const ids = icaos.join(',');
  const [m, t] = await Promise.all([
    fetchUpstream(`${BASE()}/metar?ids=${ids}&format=json`, { provider: 'aviationweather', revalidate: 600 }),
    fetchUpstream(`${BASE()}/taf?ids=${ids}&format=json`, { provider: 'aviationweather', revalidate: 600 }),
  ]);
  if (!m.ok && !t.ok) return { ok: false, reason: m.reason };
  const metars = m.ok && Array.isArray(m.data) ? m.data : [];
  const tafs = t.ok && Array.isArray(t.data) ? t.data : [];
  return {
    ok: true,
    data: icaos.map((icao) => {
      const metar = metars.find((x) => x.icaoId === icao);
      const taf = tafs.find((x) => x.icaoId === icao);
      return {
        icao,
        metar: metar ? decodeMetar(metar) : null,
        taf: taf ? tafSummary(taf) : null,
      };
    }),
  };
}
