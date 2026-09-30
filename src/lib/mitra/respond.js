// Mausam Mitra pipeline (PRD 10.3): normalise -> safety -> intent -> slots
// -> data -> rules and indices -> template. Deterministic and grounded:
// every number in a reply comes from the snapshot or the rule functions
// the homepage uses. Network access is injected (env.getSnapshot,
// env.geocode, env.getAirport), so the pipeline is testable in Node.

import { detectLang, normalise } from './normalise.js';
import { detectEmergency, aidKey } from './safety.js';
import { classify, switchTarget } from './intents.js';
import { extractSlots, airportFor, PART_HOURS } from './slots.js';
import { buildContext } from '../mausam/rules/context.js';
import { seaNow } from '../mausam/rules/coast.js';
import { schoolRunCheck } from '../mausam/rules/family.js';
import { bestRunWindow } from '../mausam/indices/runScore.js';
import { sprayWindow, frostRisk } from '../mausam/indices/farm.js';
import { fisherVerdict, tideExtrema } from '../mausam/indices/seaSafety.js';
import { uvCategory } from '../mausam/indices/uv.js';
import { heatBand } from '../mausam/indices/heatIndex.js';
import { leaveVerdict, rainSpans } from '../mausam/commute.js';
import { packingList } from '../mausam/packing.js';
import { summarize } from '../mausam/summary.js';
import { summaryText, fmtWhen } from '../mausam/cardText.js';
import { CITIES } from '../../data/cities.js';
import { officialStatus } from '../mausam/warnings.js';
import { levelName } from '../mausam/hazards.js';
import { addDays, hourOfIso, localParts, nextClockTime, isoAt, sliceHours } from '../mausam/time.js';
import { fmtTime, fmtTemp, fmtWeekday, fmtVisibility, relativeDay } from '../format.js';

const SEA_INTENTS = new Set(['sea.safe', 'tide.times', 'fisher.go']);
const ALWAYS_CURRENT = new Set(['greeting', 'thanks', 'fallback', 'language.switch', 'lightning.safety', 'app.help']);

const round = (x) => Math.round(x);

/** Chips per intent: one link to the page that holds the details. */
const CHIP = {
  'weather.now': ['forecast', '/forecast'],
  'weather.today': ['forecast', '/forecast'],
  'weather.tomorrow': ['forecast', '/forecast'],
  'rain.when': ['rain5', '/forecast'],
  'rain.umbrella': ['rain5', '/forecast'],
  'heat.today': ['health', '/health'],
  'aqi.now': ['health', '/health'],
  'uv.today': ['health', '/health'],
  'run.best': ['run', '/run'],
  'sea.safe': ['coast', '/coast'],
  'tide.times': ['coast', '/coast'],
  'fisher.go': ['coast', '/coast'],
  'travel.dest': ['travel', '/travel'],
  'travel.flight': ['travel', '/travel'],
  'travel.pack': ['travel', '/travel'],
  'family.school': ['family', '/family'],
  'farm.spray': ['farm', '/farm'],
  'farm.rain5': ['farm', '/farm'],
  'farm.frost': ['farm', '/farm'],
  'commute.leave': ['commute', '/commute'],
  'fog.today': ['forecast', '/forecast'],
  'alerts.list': ['alerts', '/alerts'],
  'lightning.safety': ['learn', '/learn'],
  'app.help': ['help', '/help'],
};

export const STARTERS = {
  default: ['rainToday', 'air', 'alerts', 'runBest'],
  farm: ['spray', 'rainToday', 'alerts', 'frost'],
  coast: ['swim', 'rainToday', 'alerts', 'air'],
  fisher: ['fishing', 'alerts', 'rainToday', 'air'],
  commute: ['leave', 'rainToday', 'alerts', 'air'],
  health: ['air', 'uv', 'alerts', 'rainToday'],
};

function dayWindow(ctx, when) {
  const d = when.day ?? 0;
  const date = addDays(ctx.dateKey, d);
  let hours = ctx.hoursOn(date);
  if (when.part) {
    const [a, b] = PART_HOURS[when.part];
    hours = hours.filter((h) => hourOfIso(h.time) >= a && hourOfIso(h.time) < b);
  } else if (when.hour != null) {
    hours = hours.filter((h) => Math.abs(hourOfIso(h.time) - when.hour) <= 1);
  }
  if (d === 0) hours = hours.filter((h) => Date.parse(h.time) + 3600e3 > ctx.nowMs);
  return { date, hours, day: ctx.daily.find((x) => x.date === date) || null };
}

/** "today", "tomorrow morning", "on Friday evening" in the reply language. */
function whenLabel(t, lang, ctx, when, date) {
  const rel = relativeDay(date, ctx.dateKey);
  const day = rel ? t(`common.${rel}`) : fmtWeekday(date, lang);
  const part = when.part ? ` ${t(`slots.${when.part}`)}` : '';
  return `${day}${part}`.toLowerCase().trim();
}

function sourceLine(t, lang, snapshot, kind = 'forecast') {
  if (!snapshot) return null;
  if (snapshot.isDemo) return t('mitra.sourceDemo');
  const names = {
    forecast: t('sources.open-meteo'),
    air: t(snapshot.air?.method === 'cpcb' ? 'sources.cpcb' : 'sources.open-meteo-air'),
    marine: t('sources.open-meteo-marine'),
    warnings: t('mitra.sourceWarnings'),
    calculated: t('sources.calculated'),
  };
  return t('mitra.source', { source: names[kind] || names.forecast, time: fmtTime(snapshot.current?.updatedAt || snapshot.fetchedAt, lang) });
}

function emergencyReply(t, kind) {
  const aid = aidKey(kind);
  return {
    kind: 'emergency',
    text: t('mitra.emergency.lead'),
    lines: [aid ? t(`mitra.emergency.aid.${aid}`) : null, t('mitra.emergency.control')].filter(Boolean),
    calls: ['112', '108', '1077', '1070'],
    chips: [],
  };
}

async function resolvePlace(env, slots, intent) {
  const ref = slots.placeRef;
  if (ref.kind && ref.kind !== 'query') return { place: ref.place, stated: true };
  if (ref.kind === 'query' && env.geocode) {
    const hit = await env.geocode(ref.query).catch(() => null);
    if (hit) return { place: hit, stated: true };
    return { place: env.place, stated: false, notFound: ref.query };
  }
  // Farm questions default to the saved farm, commute to home.
  const byType = { 'farm.spray': 'farm', 'farm.rain5': 'farm', 'farm.frost': 'farm', 'family.school': 'school' }[intent];
  const typed = byType && env.places?.find((p) => p.type === byType);
  if (typed) return { place: typed, stated: true };
  return { place: env.place, stated: false };
}

function sameSpot(a, b) {
  return a && b && Math.abs(a.lat - b.lat) < 0.02 && Math.abs(a.lon - b.lon) < 0.02;
}

/**
 * @param {string} text
 * @param {object} env { uiLang, tFor(lang), now, place, places, snapshot,
 *   personaSettings, personas, reports, getSnapshot(place, {marine}),
 *   geocode(query), getAirport(icao) }
 * @returns {Promise<{ kind, lang, text, lines, chips, source, calls?, switchTo? }>}
 */
export async function respond(text, envIn) {
  const env = { ...envIn, now: envIn.now ?? Date.now() };
  const lang = String(text || '').trim() ? detectLang(text, env.uiLang) : env.uiLang;
  const t = env.tFor(lang);
  const base = { lang, lines: [], chips: [], source: null };

  // 1. Safety first, always.
  const emergency = detectEmergency(text);
  if (emergency) return { ...base, ...emergencyReply(t, emergency.kind) };

  // 2. Intent and slots.
  const { id: intent } = classify(text);
  if (intent === 'greeting') return { ...base, kind: 'answer', text: t('mitra.greeting'), chips: starterChips(t, env) };
  if (intent === 'thanks') return { ...base, kind: 'answer', text: t('mitra.thanks') };
  if (intent === 'language.switch') {
    const to = switchTarget(text);
    return { ...base, lang: to, kind: 'switch', switchTo: to, text: env.tFor(to)('mitra.switched') };
  }
  if (intent === 'fallback') return { ...base, kind: 'answer', text: t('mitra.fallback'), chips: starterChips(t, env) };
  if (intent === 'lightning.safety') {
    return {
      ...base,
      kind: 'answer',
      text: t('mitra.a.lightning'),
      lines: [t('mitra.a.lightning3030')],
      chips: [chip(t, 'learn', '/learn'), chip(t, 'work', '/work')],
      calls: ['108'],
    };
  }
  if (intent === 'app.help') return helpReply(t, base, normalise(text));

  const todayDow = env.now ? new Date(`${localParts(env.now, 330).date}T12:00:00Z`).getUTCDay() : null;
  const slots = extractSlots(text, { places: env.places || [], todayDow });
  const { place, stated, notFound } = await resolvePlace(env, slots, intent);
  const wantMarine = SEA_INTENTS.has(intent);
  let snapshot = null;
  if (!ALWAYS_CURRENT.has(intent)) {
    const current = sameSpot(place, env.place) && env.snapshot && (!wantMarine || env.snapshot.marine);
    snapshot = current ? env.snapshot : await env.getSnapshot(place, { marine: wantMarine }).catch(() => null);
  }
  if (!snapshot) return { ...base, kind: 'answer', text: t('mitra.noData', { place: place.name }) };

  const ctx = buildContext({
    now: env.now,
    snapshot,
    personas: env.personas || ['citizen'],
    settings: env.personaSettings || {},
    savedPlaces: env.places || [],
    reports: env.reports || [],
  });
  const hiName = place.nameHi || CITIES.find((c) => c.name === place.name || place.name?.includes(c.name))?.nameHi;
  const name = lang === 'hi' && hiName ? hiName : place.name;
  if (slots.when.assumed) base.lines.push(t('mitra.assumedTomorrow'));

  const out = answer(intent, { t, lang, ctx, snapshot, slots, place: { ...place, name }, env });
  // Airport questions: add the latest observation (METAR) when available.
  if (out.airport && env.getAirport) {
    const m = await env.getAirport(out.airport).catch(() => null);
    if (m?.visibilityM != null) {
      const words = (m.words || []).map((w) => t(`metar.${w}`)).join(', ') || t('metar.clear');
      out.lines = [t('mitra.a.metar', { vis: fmtVisibility(m.visibilityM, lang), words }), ...(out.lines || [])];
    }
  }
  // Say which place when the user did not, unless the answer already names it.
  const prefix = notFound
    ? t('mitra.placeNotFound', { query: notFound, place: name })
    : !stated && !out.text.includes(name)
      ? t('mitra.forPlace', { place: name })
      : '';
  const [chipKey, href] = CHIP[intent] || ['forecast', '/forecast'];
  return {
    ...base,
    kind: out.kind || 'answer',
    text: prefix ? `${prefix} ${out.text}` : out.text,
    lines: [...base.lines, ...(out.lines || [])],
    chips: out.chips || [chip(t, chipKey, href)],
    source: out.source === undefined ? sourceLine(t, lang, snapshot, out.sourceKind) : out.source,
  };
}

function chip(t, key, href) {
  return { label: t(`mitra.chips.${key}`), href };
}

function starterChips(t, env) {
  const ids = env.personas || [];
  const set = STARTERS[ids.find((p) => STARTERS[p]) || 'default'];
  return set.map((k) => ({ label: t(`mitra.starters.${k}`), send: t(`mitra.starters.${k}`) }));
}

function helpReply(t, base, tokens) {
  const set = new Set(tokens);
  const topics = [
    ['skySnap', ['sky', 'snap', 'cloud', 'clouds', 'बादल']],
    ['report', ['report', 'waterlogging', 'flood', 'जलभराव']],
    ['farm', ['farm', 'khet', 'खेत']],
    ['household', ['household', 'family', 'member', 'dadi', 'परिवार']],
    ['language', ['language', 'hindi', 'भाषा']],
    ['textSize', ['text', 'font', 'size', 'bigger', 'contrast']],
    ['notifications', ['notification', 'notifications', 'alerts', 'सूचना']],
    ['ranking', ['decide', 'order', 'ranking', 'why']],
    ['privacy', ['privacy', 'data', 'delete', 'निजता']],
  ];
  const hit = topics.find(([, words]) => words.some((w) => set.has(normalise(w)[0])));
  const key = hit ? hit[0] : 'general';
  const href = { skySnap: '/sky-snap', report: '/report', farm: '/settings#personas', household: '/household', language: '/settings#language', textSize: '/settings#accessibility', notifications: '/settings#notifications', ranking: '/settings#layout', privacy: '/settings#data', general: '/help' }[key];
  return { ...base, kind: 'answer', text: t(`mitra.help.${key}`), chips: [{ label: t('mitra.chips.open'), href }] };
}

function answer(intent, a) {
  const { t, lang, ctx, snapshot, slots, place } = a;
  const when = slots.when;
  const cur = snapshot.current || {};
  const temp = (x) => fmtTemp(x);
  const time = (iso) => fmtTime(iso, lang);
  // With a part of day already in the sentence, drop the Hindi period word.
  const timeIn = (iso) => (lang === 'hi' && when.part ? fmtTime(iso, lang).replace(/^(तड़के|सुबह|दोपहर|शाम|रात)\s+/, '') : fmtTime(iso, lang));
  const lower = (s) => (lang === 'en' ? s.toLowerCase() : s);

  switch (intent) {
    case 'weather.now': {
      return {
        text: t('mitra.a.now', {
          place: place.name,
          cond: t(`wmo.${cur.wmo}`),
          temp: temp(cur.tempC),
          feels: temp(cur.feelsC),
          rh: round(cur.rh),
          wind: round(cur.windKmh),
        }),
      };
    }
    case 'weather.today':
    case 'weather.tomorrow': {
      const d = intent === 'weather.today' && when.day == null ? 0 : when.day ?? 1;
      if (d === 0 && !when.part) {
        const s = summarize(snapshot, ctx.nowMs, { offsetMin: ctx.offsetMin });
        const day = ctx.day(0);
        return {
          text: summaryText(s, { t, lang }),
          lines: day ? [t('mitra.a.dayLine', { max: temp(day.maxC), min: temp(day.minC), prob: day.precipProbMax })] : [],
        };
      }
      const { date, day } = dayWindow(ctx, { ...when, day: d });
      if (!day) return { text: t('mitra.beyondForecast') };
      return {
        text: t('mitra.a.day', {
          when: whenLabel(t, lang, ctx, when, date),
          place: place.name,
          cond: t(`wmo.${day.wmo}`),
          max: temp(day.maxC),
          min: temp(day.minC),
          prob: day.precipProbMax,
        }),
      };
    }
    case 'rain.when':
    case 'rain.umbrella': {
      const { date, hours } = dayWindow(ctx, when);
      if (!hours.length) return { text: t('mitra.beyondForecast') };
      const label = whenLabel(t, lang, ctx, when, date);
      const wet = hours.find((h) => h.precipProb >= 50 && (h.precipMm ?? 0) >= 0.1) || hours.find((h) => h.precipProb >= 60);
      const peak = hours.reduce((x, y) => (y.precipProb > x.precipProb ? y : x));
      if (intent === 'rain.umbrella') {
        return wet
          ? { text: t('mitra.a.umbrellaYes', { time: timeIn(wet.time), prob: wet.precipProb, when: label }) }
          : { text: t('mitra.a.umbrellaNo', { prob: peak.precipProb, when: label }) };
      }
      return wet
        ? {
            text: t('mitra.a.rainYes', { place: place.name, when: label, time: timeIn(wet.time), prob: wet.precipProb }),
            lines: peak !== wet && peak.precipProb > wet.precipProb ? [t('mitra.a.rainPeak', { time: timeIn(peak.time), prob: peak.precipProb })] : [],
          }
        : { text: t('mitra.a.rainNo', { place: place.name, when: label, prob: peak.precipProb, time: timeIn(peak.time) }) };
    }
    case 'heat.today': {
      const { date, hours, day } = dayWindow(ctx, when);
      if (!hours.length || !day) return { text: t('mitra.beyondForecast') };
      const hot = hours.reduce((x, y) => (y.feelsC > x.feelsC ? y : x));
      const band = heatBand(hot.feelsC) || 'comfortable';
      const warn = ctx.officialWarnings.find((w) => ['heat_wave', 'severe_heat_wave', 'warm_night', 'hot_humid'].includes(w.hazard));
      return {
        text: t('mitra.a.heat', { when: whenLabel(t, lang, ctx, when, date), place: place.name, max: temp(day.maxC), feels: temp(hot.feelsC), time: timeIn(hot.time) }),
        lines: [
          warn ? t('mitra.a.heatWarning', { level: t(`levels.${levelName(warn.level)}`), hazard: t(`hazards.${warn.hazard}`) }) : null,
          band !== 'comfortable' ? t(`mitra.a.heatBand.${band}`) : null,
        ].filter(Boolean),
      };
    }
    case 'aqi.now': {
      const air = snapshot.air;
      if (!air || air.aqi == null) return { text: t('mitra.a.noAir', { place: place.name }), source: null };
      return {
        text: t('mitra.a.aqi', { place: place.name, aqi: air.aqi, category: t(`aqi.category.${air.category}`) }),
        lines: [t(`aqi.health.${air.category}`)],
        sourceKind: 'air',
      };
    }
    case 'uv.today': {
      const { date, hours } = dayWindow(ctx, when.day == null ? { ...when, day: 0 } : when);
      const all = hours.length ? hours : ctx.hoursOn(date);
      if (!all.length) return { text: t('mitra.beyondForecast') };
      const peak = all.reduce((x, y) => ((y.uv ?? 0) > (x.uv ?? 0) ? y : x));
      const cat = uvCategory(peak.uv ?? 0);
      return {
        text: t('mitra.a.uv', { place: place.name, when: whenLabel(t, lang, ctx, when, date), uv: round(peak.uv ?? 0), category: t(`uv.category.${cat}`), time: timeIn(peak.time) }),
        lines: [t(`uvAdvice.${cat}`)],
      };
    }
    case 'run.best': {
      const activity = slots.activity || ctx.settings.fitness?.activity || 'run';
      const d = when.day ?? (ctx.local.hour >= 20 ? 1 : 0);
      const { date, hours } = dayWindow(ctx, { ...when, day: d });
      if (!hours.length) return { text: t('mitra.beyondForecast') };
      const w = bestRunWindow(hours.map((h) => ({ ...h, aqi: ctx.aqiOf(h) })), { activity, durationMin: ctx.settings.fitness?.durationMin || 60 });
      const label = whenLabel(t, lang, ctx, { ...when, day: d }, date);
      if (!w || w.none) return { text: t('mitra.a.runNone', { when: label, activity: lower(t(`activityNames.${activity}`)) }) };
      const h = w.hours[0];
      return {
        text: t('mitra.a.run', {
          activity: lower(t(`activityNames.${activity}`)),
          when: label,
          start: time(w.start),
          end: time(w.end),
          score: w.score,
          temp: temp(h.tempC),
        }),
      };
    }
    case 'sea.safe': {
      const v = seaNow({ ...ctx, settings: { ...ctx.settings, coast: { ...ctx.settings.coast, ripProne: Boolean(place.beach?.ripProne) } } });
      if (!v) return { text: t('mitra.a.noSea', { place: place.name }), source: null };
      const reasons = v.reasons.map((r) => t(`verdicts.sea.reason.${r}`)).join(', ');
      return {
        text: t(`mitra.a.sea.${v.verdict}`, { place: place.name, reasons: reasons || t('mitra.a.calmSea') }),
        sourceKind: 'marine',
      };
    }
    case 'tide.times': {
      const series = sliceHours(ctx.marine?.hourly || [], ctx.nowMs, 36);
      const ext = tideExtrema(series).slice(0, 4);
      if (!ext.length) return { text: t('mitra.a.noTides', { place: place.name }), source: null };
      const list = ext.map((e) => `${lower(t(`widgets.tides.${e.type}`))} ${time(e.time)}`).join(', ');
      return { text: t('mitra.a.tides', { place: place.name, list }), lines: [t('mitra.a.tidesNote')], sourceKind: 'marine' };
    }
    case 'fisher.go': {
      const d = when.day ?? 0;
      const from = d === 0 ? ctx.nowMs : Date.parse(`${addDays(ctx.dateKey, d)}T04:00:00Z`);
      const sea = sliceHours(ctx.marine?.hourly || [], from, 24);
      const land = ctx.window(from, 24);
      const official = ctx.officialWarnings.find((w) => w.source === 'imd_marine' || w.hazard === 'high_waves' || w.hazard === 'cyclone');
      if (!sea.length && !official) return { text: t('mitra.a.noSea', { place: place.name }), source: null };
      const v = fisherVerdict({
        officialWarning: Boolean(official),
        maxWindKmh: land.length ? Math.max(...land.map((h) => h.windKmh ?? 0)) : undefined,
        maxWaveM: sea.length ? Math.max(...sea.map((h) => h.waveM ?? 0)) : undefined,
      });
      return {
        text: t(`mitra.a.fisher.${v.verdict}`, { reason: v.reason ? t(`verdicts.fisher.${v.reason}`) : '', when: whenLabel(t, lang, ctx, when, addDays(ctx.dateKey, d)) }),
        lines: [official?.text ? t('mitra.a.officialSays', { text: official.text }) : null, t('mitra.a.fisherCheck')].filter(Boolean),
        sourceKind: 'marine',
      };
    }
    case 'travel.dest': {
      const start = when.day ?? 0;
      const n = when.range || 5;
      const days = ctx.daily.filter((x) => x.date >= addDays(ctx.dateKey, start) && x.date < addDays(ctx.dateKey, start + n));
      if (!days.length) return { text: t('mitra.beyondForecast') };
      const maxs = days.map((x) => x.maxC);
      const mins = days.map((x) => x.minC);
      return {
        text: t('mitra.a.trip', {
          place: place.name,
          from: fmtWeekday(days[0].date, lang),
          to: fmtWeekday(days[days.length - 1].date, lang),
          hiLo: temp(Math.min(...maxs)),
          hiHi: temp(Math.max(...maxs)),
          loLo: temp(Math.min(...mins)),
          loHi: temp(Math.max(...mins)),
          rainy: days.filter((x) => x.precipProbMax >= 50).length,
          days: days.length,
        }),
      };
    }
    case 'travel.flight': {
      const ap = airportFor(place, slots.tokens);
      const { date, hours } = dayWindow(ctx, when);
      const vis = hours.filter((h) => h.visibilityM != null);
      const low = vis.length ? vis.reduce((x, y) => (y.visibilityM < x.visibilityM ? y : x)) : null;
      return {
        kind: 'flight',
        airport: ap?.icao || null,
        text: low
          ? t('mitra.a.flight', { airport: ap ? `${ap.city} (${ap.iata})` : place.name, when: whenLabel(t, lang, ctx, when, date), vis: fmtVisibility(low.visibilityM, lang), time: timeIn(low.time) })
          : t('mitra.beyondForecast'),
        lines: [t('widgets.flightWeather.notStatus')],
      };
    }
    case 'travel.pack': {
      const start = when.day ?? 0;
      const days = ctx.daily.filter((x) => x.date >= addDays(ctx.dateKey, start) && x.date < addDays(ctx.dateKey, start + (when.range || 5)));
      if (!days.length) return { text: t('mitra.beyondForecast') };
      const items = packingList({ days, coastal: Boolean(place.isCoastal || place.coastal || snapshot.place?.isCoastal), elevationM: snapshot.place?.elevationM || 0 });
      return { text: t('mitra.a.pack', { place: place.name, items: items.map((i) => lower(t(`packing.${i.id}`))).join(', ') }) };
    }
    case 'family.school': {
      const times = ctx.settings.family?.schoolTimes || {};
      const slotsList = ['morning', 'afternoon'].filter((s) => times[s]);
      if (!slotsList.length) return { text: t('mitra.a.schoolSet'), chips: [chip(t, 'family', '/family')], source: null };
      const parts = slotsList.map((s) => {
        const r = schoolRunCheck(ctx, times[s]);
        return r
          ? t('mitra.a.schoolIssue', { slot: t(`widgets.schoolRun.${s}`), time: time(r.time), condition: t(`verdicts.school.${r.condition}`) })
          : t('mitra.a.schoolFine', { slot: t(`widgets.schoolRun.${s}`) });
      });
      return { text: parts.join(' ') };
    }
    case 'farm.spray': {
      const d = when.day ?? 0;
      const date = addDays(ctx.dateKey, d);
      const w = sprayWindow(ctx.hourly, date);
      const label = whenLabel(t, lang, ctx, when, date);
      return w
        ? { text: t('mitra.a.spray', { when: label, start: time(w.start), end: time(w.end) }), lines: [t('widgets.sprayWindow.note')] }
        : { text: t('mitra.a.sprayNone', { when: label }), lines: [t('widgets.sprayWindow.note')] };
    }
    case 'farm.rain5': {
      const days = ctx.daily.filter((x) => x.date >= ctx.dateKey).slice(0, 5);
      if (!days.length) return { text: t('mitra.beyondForecast') };
      const total = Math.round(days.reduce((s, x) => s + (x.precipMm || 0), 0));
      const wettest = days.reduce((x, y) => ((y.precipMm || 0) > (x.precipMm || 0) ? y : x));
      return {
        text: t('mitra.a.rain5', { place: place.name, mm: total }),
        lines: (wettest.precipMm || 0) >= 1 ? [t('mitra.a.rain5Peak', { day: fmtWeekday(wettest.date, lang), mm: Math.round(wettest.precipMm) })] : [],
      };
    }
    case 'farm.frost': {
      const night = ctx.day(when.day === 1 ? 2 : 1) || ctx.day(1);
      if (!night) return { text: t('mitra.beyondForecast') };
      const nightHours = ctx.hoursOn(night.date).filter((h) => hourOfIso(h.time) < 8);
      const cloud = nightHours.length ? nightHours.reduce((s, h) => s + (h.cloudPct ?? 100), 0) / nightHours.length : 100;
      const wind = nightHours.length ? Math.max(...nightHours.map((h) => h.windKmh ?? 0)) : 99;
      const risk = frostRisk({ tminC: night.minC, cloudPct: cloud, windKmh: wind }) || 'low';
      return { text: t('mitra.a.frost', { risk: t(`risk.${risk}`), tmin: temp(night.minC) }), lines: risk !== 'low' ? [t('mitra.a.frostTip')] : [] };
    }
    case 'commute.leave': {
      const c = ctx.settings.commute || {};
      const times = (c.times || []).filter(Boolean);
      if (!times.length) return { text: t('mitra.a.commuteSet'), chips: [chip(t, 'commute', '/commute')], source: null };
      const deps = times.map((clock) => nextClockTime(clock, ctx.nowMs, ctx.offsetMin, 30)).filter(Boolean).sort((x, y) => x - y);
      const dep = deps[0];
      if (!dep) return { text: t('mitra.a.commuteSet'), chips: [chip(t, 'commute', '/commute')], source: null };
      const spans = rainSpans(ctx.window(ctx.nowMs - 3600e3, 30));
      const v = leaveVerdict({ now: ctx.nowMs, departure: dep, travelMin: c.travelMin || 45, spans });
      return {
        text: t('mitra.a.leave', {
          time: time(isoAt(dep, ctx.offsetMin)),
          verdict: t(`verdicts.commute.${v.verdict}`, { time: v.at ? time(isoAt(v.at, ctx.offsetMin)) : '' }),
        }),
      };
    }
    case 'fog.today': {
      const { date, hours } = dayWindow(ctx, when);
      const vis = hours.filter((h) => h.visibilityM != null);
      const warn = ctx.officialWarnings.find((w) => w.hazard === 'dense_fog');
      if (!vis.length) return { text: t('mitra.beyondForecast') };
      const low = vis.reduce((x, y) => (y.visibilityM < x.visibilityM ? y : x));
      const label = whenLabel(t, lang, ctx, when, date);
      return {
        text:
          low.visibilityM < 1000
            ? t('mitra.a.fog', { when: label, vis: fmtVisibility(low.visibilityM, lang), time: timeIn(low.time) })
            : t('mitra.a.fogNone', { when: label, place: place.name }),
        lines: warn ? [t('mitra.a.fogWarning', { level: t(`levels.${levelName(warn.level)}`) })] : [],
      };
    }
    case 'alerts.list': {
      const s = officialStatus(snapshot, ctx.nowMs);
      if (s.state === 'unavailable') return { text: t('mitra.a.alertsUnknown'), sourceKind: 'warnings' };
      if (s.state === 'not_applicable') return { text: t('levels.notApplicable'), source: null };
      const active = ctx.officialWarnings.filter((w) => w.level >= 2).sort((x, y) => y.level - x.level);
      if (!active.length) return { text: t('mitra.a.alertsNone', { place: place.name }), sourceKind: 'warnings' };
      return {
        text: t('mitra.a.alerts', { count: active.length, place: place.name }),
        lines: active.slice(0, 3).map((w) =>
          t('mitra.a.alertLine', {
            level: t(`levels.${levelName(w.level)}`),
            hazard: t(`hazards.${w.hazard}`, { defaultValue: w.title }),
            until: w.validTo ? fmtWhen(w.validTo, { t, lang, today: ctx.dateKey }) : '',
          }),
        ),
        sourceKind: 'warnings',
      };
    }
    default:
      return { text: t('mitra.fallback') };
  }
}
