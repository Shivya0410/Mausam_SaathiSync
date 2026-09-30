// METAR/TAF decoding for the few fields we need (PRD 12.2.5). Pure.
//
// aviationweather.gov JSON (verified 30 Sep 2026) gives `visib` in statute
// miles ("2.17" for 3500 m, or "10+"), so visibility is read from the raw
// report's 4-digit metres group first, which is how Indian METARs report it.

const WX = {
  FG: 'fog', BR: 'mist', HZ: 'haze', TS: 'thunderstorm', RA: 'rain', DZ: 'drizzle',
  DU: 'dust', SA: 'sand', FU: 'smoke', SH: 'showers', GR: 'hail', SN: 'snow', SQ: 'squall',
};

/** Weather groups (FG, BR, TS...) present in a raw METAR or TAF. */
export function weatherCodes(raw) {
  const found = new Set();
  for (const tok of String(raw || '').split(/\s+/)) {
    const m = /^(\+|-|VC)?([A-Z]{2,})$/.exec(tok);
    if (!m) continue;
    for (let i = 0; i + 2 <= m[2].length; i += 2) {
      const code = m[2].slice(i, i + 2);
      if (WX[code]) found.add(code);
    }
  }
  return [...found];
}

/** Visibility in metres from a raw METAR, falling back to statute miles. */
export function visibilityM(raw, visibMiles) {
  const toks = String(raw || '').split(/\s+/);
  // Skip the station and time groups, then find the first 4-digit group.
  for (const tok of toks.slice(2)) {
    if (/^\d{4}$/.test(tok)) return Number(tok) === 9999 ? 10000 : Number(tok);
    if (tok === 'CAVOK') return 10000;
  }
  if (visibMiles != null) {
    const n = parseFloat(String(visibMiles).replace('+', ''));
    if (Number.isFinite(n)) return Math.round(n * 1609.34);
  }
  return null;
}

/** Plain-language key parts: { visibilityM, weather: ['FG'], words: ['fog'] }. */
export function decodeMetar(m) {
  const raw = m?.rawOb || '';
  const weather = weatherCodes(raw);
  return {
    icao: m?.icaoId,
    name: m?.name ?? null,
    observedAt: m?.reportTime ?? (m?.obsTime ? new Date(m.obsTime * 1000).toISOString() : null),
    visibilityM: visibilityM(raw, m?.visib),
    weather,
    words: weather.map((c) => WX[c]),
    windKmh: Number.isFinite(m?.wspd) ? Math.round(m.wspd * 1.852) : null,
    windDirDeg: Number.isFinite(m?.wdir) ? m.wdir : null,
    tempC: m?.temp ?? null,
    raw,
  };
}

/** TAF highlights: fog, mist or thunderstorm expected, and the lowest visibility. */
export function tafSummary(t) {
  const raw = t?.rawTAF || '';
  const weather = weatherCodes(raw);
  const vis = String(raw)
    .split(/\s+/)
    .slice(3)
    .filter((x) => /^\d{4}$/.test(x) && !/^\d{4}\/\d{4}$/.test(x))
    .map(Number);
  return {
    validFrom: t?.validTimeFrom ? new Date(t.validTimeFrom * 1000).toISOString() : null,
    validTo: t?.validTimeTo ? new Date(t.validTimeTo * 1000).toISOString() : null,
    fog: weather.includes('FG'),
    mist: weather.includes('BR'),
    thunderstorm: weather.includes('TS'),
    minVisibilityM: vis.length ? Math.min(...vis.map((v) => (v === 9999 ? 10000 : v))) : null,
    raw,
  };
}
