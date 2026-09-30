// Shared Open-Meteo helpers. Open-Meteo returns local times without an
// offset ("2026-09-30T14:00") plus utc_offset_seconds; we attach the offset
// so every time in a snapshot is unambiguous.

export function formatOffset(sec) {
  const sign = sec >= 0 ? '+' : '-';
  const abs = Math.abs(sec);
  const h = String(Math.floor(abs / 3600)).padStart(2, '0');
  const m = String(Math.floor((abs % 3600) / 60)).padStart(2, '0');
  return `${sign}${h}:${m}`;
}

export function withOffset(localTime, offset) {
  if (!localTime) return null;
  return localTime.length === 16 ? `${localTime}:00${offset}` : `${localTime}${offset}`;
}

/** Column accessor that tolerates a missing column. */
export const col = (obj, key, i, fallback = null) => {
  const v = obj?.[key]?.[i];
  return v === undefined || v === null ? fallback : v;
};

/** Base URLs, overridable for a self-hosted or paid Open-Meteo (PRD 13.11). */
export function baseUrl(kind) {
  const custom = process.env.OPEN_METEO_BASE_URL;
  const defaults = {
    forecast: 'https://api.open-meteo.com/v1/forecast',
    air: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    marine: 'https://marine-api.open-meteo.com/v1/marine',
    archive: 'https://archive-api.open-meteo.com/v1/archive',
    geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  };
  if (custom && kind === 'forecast') return `${custom.replace(/\/$/, '')}/v1/forecast`;
  return defaults[kind];
}
