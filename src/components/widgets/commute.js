"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { WidgetShell, NotAvailable } from './shared';
import ExternalLink from '../shared/ExternalLink';
import { fmtTime, fmtTemp } from '../../lib/format';
import { nextDeparture } from '../../lib/mausam/rules/commute';
import { rainSpans, leaveVerdict, trafficLink } from '../../lib/mausam/commute';
import { schoolRunCheck } from '../../lib/mausam/rules/family';
import { isoAt } from '../../lib/mausam/time';

/** Leave-now verdict for the next departure (PRD 6.6.10). Pure over ctx. */
export function commuteVerdict(ctx) {
  const dep = nextDeparture(ctx);
  if (dep == null) return null;
  const c = ctx.settings.commute || {};
  const v = leaveVerdict({ now: ctx.nowMs, departure: dep, travelMin: c.travelMin || 45, spans: rainSpans(ctx.window(ctx.nowMs - 3600e3, 24)) });
  return {
    departure: isoAt(dep, ctx.offsetMin),
    verdict: v.verdict,
    time: v.at != null ? isoAt(v.at, ctx.offsetMin) : null,
    hour: ctx.hourAt(dep),
  };
}

// ── Leave now or wait? ──
export function CommuteNowWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const c = view.ctx.settings.commute || {};
  const v = commuteVerdict(view.ctx);
  if (!v) {
    return (
      <WidgetShell id="commuteNow" icon="fa-solid fa-motorcycle">
        <NotAvailable messageKey="widgets.commuteNow.setTimes" action={<Link href="/settings#personas">{t('widgets.commuteNow.set')}</Link>} />
      </WidgetShell>
    );
  }
  const good = v.verdict === 'no_rain' || v.verdict === 'leave_on_time';
  return (
    <WidgetShell id="commuteNow" icon="fa-solid fa-motorcycle" more={{ href: '/commute', label: t('widgets.commuteNow.more') }}>
      <p className="ms-muted">{t('widgets.commuteNow.next', { time: fmtTime(v.departure, lang) })}</p>
      <p className={`ms-verdict ms-verdict--${good ? 'safe' : 'caution'}`}>
        <i className={`fa-solid ${good ? 'fa-circle-check' : 'fa-umbrella'}`} aria-hidden="true"></i>{' '}
        {t(`verdicts.commute.${v.verdict}`, { time: v.time ? fmtTime(v.time, lang) : '' })}
      </p>
      {v.hour ? (
        <p className="ms-muted">
          {t('widgets.commuteNow.at', { temp: fmtTemp(v.hour.tempC), rain: v.hour.precipProb })}
        </p>
      ) : null}
      {c.home && c.work ? (
        <p className="ms-actions">
          <ExternalLink href={trafficLink(c.home, c.work, c.mode)} className="ms-btn ms-btn--secondary">
            {t('widgets.commuteNow.traffic')}
          </ExternalLink>
        </p>
      ) : (
        <p className="ms-muted">{t('widgets.commuteNow.addPlaces')}</p>
      )}
      <p className="ms-muted">{t('widgets.commuteNow.trafficNote')}</p>
    </WidgetShell>
  );
}

// ── School run (morning and afternoon) ──
const CHIP_ICON = { umbrella: 'fa-umbrella', water: 'fa-bottle-water', mask: 'fa-head-side-mask', torch: 'fa-lightbulb', jacket: 'fa-vest' };

export function SchoolRunWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const times = view.ctx.settings.family?.schoolTimes || {};
  const slots = ['morning', 'afternoon'].filter((s) => times[s]);
  if (!slots.length) {
    return (
      <WidgetShell id="schoolRun" icon="fa-solid fa-school">
        <NotAvailable messageKey="widgets.schoolRun.setTimes" action={<Link href="/settings#personas">{t('widgets.schoolRun.set')}</Link>} />
      </WidgetShell>
    );
  }
  return (
    <WidgetShell id="schoolRun" icon="fa-solid fa-school" more={{ href: '/family', label: t('widgets.schoolRun.more') }}>
      <ul className="ms-school">
        {slots.map((s) => {
          const r = schoolRunCheck(view.ctx, times[s]);
          return (
            <li key={s}>
              <strong>{t(`widgets.schoolRun.${s}`)} · {fmtTime(times[s], lang)}</strong>
              {r ? (
                <>
                  <span>{r.conditions.map((c) => t(`verdicts.school.${c}`)).join(', ')}</span>
                  <span className="ms-chips">
                    {r.chips.map((c) => (
                      <span key={c} className="ms-chip">
                        <i className={`fa-solid ${CHIP_ICON[c] || 'fa-circle'}`} aria-hidden="true"></i> {t(`cards.chips.${c}`)}
                      </span>
                    ))}
                  </span>
                </>
              ) : (
                <span>{t('widgets.schoolRun.fine')}</span>
              )}
            </li>
          );
        })}
      </ul>
    </WidgetShell>
  );
}
