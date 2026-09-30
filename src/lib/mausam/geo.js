// Geometry helpers for "near my places" checks. Pure.

const R_KM = 6371;
const rad = (d) => (d * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * Distance (km) from point p to the segment a-b. Uses an equirectangular
 * projection around the segment, which is accurate enough for city-scale
 * commute corridors.
 */
export function pointToSegmentKm(p, a, b) {
  const lat0 = rad((a.lat + b.lat) / 2);
  const toXY = (q) => ({ x: rad(q.lon) * Math.cos(lat0) * R_KM, y: rad(q.lat) * R_KM });
  const P = toXY(p);
  const A = toXY(a);
  const B = toXY(b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((P.x - A.x) * dx + (P.y - A.y) * dy) / len2));
  return Math.hypot(P.x - (A.x + t * dx), P.y - (A.y + t * dy));
}

export function midpoint(a, b) {
  return { lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 };
}

/** 8-point compass direction the wind comes FROM ('N', 'NE', ...). */
export function compass8(deg) {
  if (!Number.isFinite(deg)) return null;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Round a coordinate to a grid step (default about 500 m). */
export function roundToGrid(value, step = 0.0045) {
  return Math.round(Math.round(value / step) * step * 1e6) / 1e6;
}
