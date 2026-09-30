// One person's view of the weather: rule context, decision cards and ranked
// widgets (PRD sections 5.11, 6.3, 13.4). Pure; runs on the device.

import { buildContext, runRules } from './rules/index.js';
import { rankWidgets, widgetUrgency } from './rankWidgets.js';
import { seasonFor } from './season.js';
import { timeOfDay } from './time.js';
import { WIDGETS, WIDGET_HAZARDS, RAIN_WIDGETS } from '../../config/widgets.js';
import { BEACHES } from '../../data/beaches.js';

/**
 * Rule settings from the stores (settings shapes in src/lib/stores/index.js).
 * Home, work and school become coordinates; trips and events join in.
 */
export function ruleSettings({ personaSettings = {}, places = [], trips = [], events = [] }) {
  const byId = (id) => places.find((p) => p.id === id) || null;
  const ofType = (type) => places.find((p) => p.type === type) || null;
  const c = personaSettings.commute || {};
  const home = byId(c.homeId) || ofType('home');
  const work = byId(c.workId) || ofType('work');
  const coast = personaSettings.coast || {};
  const beach = BEACHES.find((b) => b.id === coast.currentBeachId) || null;
  return {
    commute: {
      times: (c.times || []).filter(Boolean),
      mode: c.mode,
      travelMin: c.travelMin || 45,
      home: home ? { lat: home.lat, lon: home.lon, name: home.name } : undefined,
      work: work ? { lat: work.lat, lon: work.lon, name: work.name } : undefined,
    },
    family: personaSettings.family || {},
    fitness: personaSettings.fitness || {},
    work: personaSettings.work || {},
    farm: personaSettings.farm || {},
    coast: { ...coast, ripProne: Boolean(beach?.ripProne) },
    travel: { trips },
    events: { events },
  };
}

/**
 * @param {object} a
 * @param {object} a.snapshot WeatherSnapshot
 * @param {number} a.now ms
 * @param {Array<{id, role}>} a.personas primary first
 * @param {string[]} [a.sensitivities]
 * @param {object} [a.personaSettings]
 * @param {Array} [a.places] saved places
 * @param {Array} [a.trips]
 * @param {Array} [a.events]
 * @param {Array} [a.reports]
 * @param {Array} [a.coolSpots]
 * @param {object} [a.tripData] ctx.trips shape
 * @param {object} [a.climatology]
 * @param {object} [a.layout]
 * @param {object} [a.usage]
 * @param {Set<string>} [a.dismissed]
 * @param {string[]} [a.availableWidgets] widget ids with a component
 */
export function personalView(a) {
  const personaIds = a.personas.map((p) => p.id);
  const ctx = buildContext({
    now: a.now,
    snapshot: a.snapshot,
    personas: personaIds,
    sensitivities: a.sensitivities || [],
    settings: ruleSettings(a),
    reports: a.reports || [],
    savedPlaces: a.places || [],
    coolSpots: a.coolSpots || [],
    trips: a.tripData || {},
    climatology: a.climatology || {},
  });
  const cards = runRules(ctx, { dismissed: a.dismissed || new Set() });
  const { season, northeastMonsoon } = seasonFor(ctx.local.month, a.snapshot?.place?.state);
  const tod = timeOfDay(ctx.local.hour);
  const available = a.availableWidgets ? new Set(a.availableWidgets) : null;
  const urgency = widgetUrgency({ widgetHazards: WIDGET_HAZARDS, warnings: ctx.officialWarnings, cards, air: a.snapshot?.air });
  const boost = northeastMonsoon ? Object.fromEntries(RAIN_WIDGETS.map((id) => [id, 1.3])) : {};
  const widgets = available ? WIDGETS.filter((w) => available.has(w.id)) : WIDGETS;
  const ranked = rankWidgets({
    widgets,
    personas: a.personas,
    season,
    timeOfDay: tod,
    urgency,
    layout: a.layout,
    usage: a.usage,
    boost,
  });
  return { ctx, cards, ranked, season, timeOfDay: tod };
}
