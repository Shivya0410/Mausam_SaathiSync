// Turns a language-neutral DecisionCard into display text (PRD 6.2, 6.8).
// Pure: `t` (i18next) and `lang` are passed in, so this is testable in Node.

import { fmtTime, fmtDate, fmtDistance, fmtVisibility, relativeDay, compassWord } from '../format.js';
import { levelName } from './hazards.js';

const TIME_FIELDS = ['startsAt', 'time', 'start', 'end', 'when', 'departure', 'rainStart', 'sunset', 'lastStrike'];
const DATE_FIELDS = ['date', 'day'];

/**
 * "4 PM", "tomorrow 6 AM", or "Thu 3 PM" relative to `today`.
 * Plain dates become "today", "tomorrow" or "Thu, 2 Oct".
 */
export function fmtWhen(value, { t, lang, today }) {
  if (!value) return '';
  const date = String(value).slice(0, 10);
  const rel = relativeDay(date, today);
  if (String(value).length <= 10) {
    return rel === 'today' || rel === 'tomorrow' ? t(`common.${rel}`) : fmtDate(date, lang);
  }
  const time = fmtTime(value, lang);
  if (rel === 'today') return time;
  if (rel === 'tomorrow') return t('common.tomorrowAt', { time });
  return `${fmtDate(date, lang, { month: undefined })} ${time}`.trim();
}

/** Format the params of a tip for interpolation. */
export function formatParams(card, { t, lang, today }) {
  const p = { ...card.params };
  const ctx = { t, lang, today };
  for (const f of TIME_FIELDS) if (p[f]) p[f] = fmtWhen(p[f], ctx);
  for (const f of DATE_FIELDS) if (p[f]) p[f] = fmtWhen(String(p[f]).slice(0, 10), ctx);
  // Rules report when something begins as `startsAt`; the text says {{time}}.
  if (p.time == null && p.startsAt) p.time = p.startsAt;

  const id = card.ruleId;
  if (p.category) p.category = t(id === 'health.uvHigh' ? `uv.category.${card.params.category}` : `aqi.category.${card.params.category}`);
  if (p.band) p.band = t(`verdicts.comfort.${p.band}`);
  if (p.activity) p.activity = t(`activities.${p.activity}`);
  if (p.dir) p.dir = compassWord(p.dir, lang, { long: true });
  if (Number.isFinite(p.distanceM)) p.distance = fmtDistance(p.distanceM, lang);
  if (Number.isFinite(p.visibilityM)) p.visibilityM = fmtVisibility(p.visibilityM, lang);
  if (id === 'commute.leave') p.verdict = t(`verdicts.commute.${card.params.verdict}`, { time: p.time });
  if (id === 'coast.stayOut' || id === 'coast.caution') p.reason = t(`verdicts.sea.reason.${card.params.reason}`);
  if (id === 'fisher.noGo') p.text = card.params.text || t(`verdicts.fisher.${card.params.reason}`);
  if (id === 'travel.destWarning') {
    p.hazard = t(`hazards.${card.params.hazard}`);
    p.level = t(`levels.${levelName(card.params.level)}`);
  }
  if (id === 'travel.pack') p.items = (card.params.items || []).map((i) => t(`packing.${i}`)).join(', ');
  if (id === 'family.schoolMorning' || id === 'family.schoolAfternoon') {
    p.condition = t(`verdicts.school.${card.params.condition}`);
    p.action = (card.chips || []).map((c) => t(`cards.chips.${c}`)).join(', ');
  }
  if (id === 'coast.goodDay') {
    p.time = card.params.time ? p.time : t('common.notAvailableShort');
    p.sunset = card.params.sunset ? p.sunset : t('common.notAvailableShort');
  }
  return p;
}

/**
 * @returns {{ kind, level?, headline, reason, why, action?, advice?, addOns: string[] }}
 */
export function cardText(card, { t, lang = 'en', today }) {
  const ctx = { t, lang, today };
  if (card.kind === 'official') {
    const p = card.params;
    const lvl = levelName(p.level);
    const validFrom = p.validFrom ? String(p.validFrom).slice(0, 10) : null;
    const rel = validFrom ? relativeDay(validFrom, today) : null;
    const dayLabel = rel === 'today' || !validFrom || validFrom < today ? t('common.today') : fmtWhen(validFrom, ctx);
    const hazard = t(`hazards.${p.hazard}`, { defaultValue: p.title || p.hazard });
    return {
      kind: 'official',
      level: lvl,
      headline: `${hazard} · ${t(`levels.${lvl}`)} · ${dayLabel}`,
      reason: p.text || p.title || hazard,
      issuer: p.issuer,
      validTo: p.validTo ? fmtWhen(p.validTo, ctx) : null,
      action: t(`levels.action.${lvl}`),
      advice: card.adviceKey ? t(card.adviceKey) : null,
      instruction: p.instruction || null,
      why: t('rules.official.why'),
      addOns: (card.addOns || []).map((a) =>
        t(`rules.${a.ruleId}.headline`, formatParams({ ruleId: a.ruleId, params: a.params, chips: [] }, ctx)),
      ),
    };
  }
  const params = formatParams(card, ctx);
  return {
    kind: card.kind,
    headline: t(`rules.${card.ruleId}.headline`, params),
    reason: t(`rules.${card.ruleId}.reason`, params),
    why: t(card.whyKey || `rules.${card.ruleId}.why`),
    addOns: [],
  };
}

/** Plain text of a card for "Listen" (speech) and "Share". */
export function cardSpeech(text) {
  return [text.headline, text.reason, text.action, text.advice, ...(text.addOns || [])].filter(Boolean).join('. ');
}

/**
 * Keep card order stable within a session (PRD 6.4 rule 8): if the same
 * cards are present with the same severities, keep the previous order, so
 * cards do not jump under the user's finger on a data refresh.
 * `prev` is [{ id, severity }] from the last render. Pure.
 */
export function stableOrder(prev, cards) {
  if (!prev?.length || prev.length !== cards.length) return cards;
  const before = new Map(prev.map((p, i) => [p.id, { i, severity: p.severity }]));
  const same = cards.every((c) => before.has(c.id) && before.get(c.id).severity === c.severity);
  return same ? cards.slice().sort((a, b) => before.get(a.id).i - before.get(b.id).i) : cards;
}

/** The one-line summary sentence (PRD 5.4) from summarize() output. */
export function summaryText(s, { t, lang }) {
  if (!s) return '';
  const greeting = t(s.greetingKey) + (s.name ? `, ${s.name}` : '');
  const band = s.tempBand ? t(`home.tempBand.${s.tempBand}`) : null;
  const place = s.placeName || '';
  let base = band ? t(s.humid ? 'home.summary.baseHumid' : 'home.summary.base', { band, place }) : t('home.summary.noBand', { place });
  if (s.change) base = t('home.summary.withChange', { base, change: t(`home.change.${s.change.type}`, { time: fmtTime(s.change.time, lang) }) });
  return t('home.summary.sentence', { greeting, base });
}
