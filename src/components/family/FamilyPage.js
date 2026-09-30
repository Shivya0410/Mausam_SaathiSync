"use client";

import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import { Tips } from '../persona/Sections';
import ExternalLink from '../shared/ExternalLink';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { comfortBand } from '../../lib/mausam/indices/comfortIndex';
import { fmtWeekday } from '../../lib/format';
import { weekendPlan } from '../../lib/mausam/plans';

/** Parents and family (PRD 8.5): school run, rain, air for play, heat for children. */
export default function FamilyPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [settings, setSettings] = useStore(stores.personaSettings);
  const times = settings.family.schoolTimes;
  const setTime = (slot, v) =>
    setSettings((s) => ({ ...s, family: { ...s.family, schoolTimes: { ...s.family.schoolTimes, [slot]: v || null } } }));
  return (
    <PersonaPage persona="family" pageKey="family" hero="schoolRun" widgets={['rainSoon', 'aqi', 'bestTimeOut', 'lightning']} services={['ndma']} learn={['heat', 'monsoonKit', 'lightning']}>
      {({ view, env }) => {
        const plan = view && env.today ? weekendPlan(view.ctx, env.today) : [];
        const best = plan.flatMap((d) => d.slots.map((s) => ({ ...s, date: d.date }))).sort((a, b) => b.score - a.score)[0];
        return (
          <>
            <section className="ms-card" aria-labelledby="f-times">
              <h2 id="f-times">{t('family.times')}</h2>
              <div className="ms-row-fields">
                <label className="ms-field">
                  <span>{t('onboarding.details.schoolMorning')}</span>
                  <input type="time" value={times.morning || ''} onChange={(e) => setTime('morning', e.target.value)} />
                </label>
                <label className="ms-field">
                  <span>{t('onboarding.details.schoolAfternoon')}</span>
                  <input type="time" value={times.afternoon || ''} onChange={(e) => setTime('afternoon', e.target.value)} />
                </label>
              </div>
              <p className="ms-muted">{t('onboarding.details.noChildData')}</p>
            </section>
            <Tips id="f-heat" titleKey="family.heatTitle" listKey="family.heatTips" icon="fa-solid fa-child" footerKey="family.tipsSource" />
            {plan.length ? (
              <section className="ms-card" aria-labelledby="f-weekend">
                <h2 id="f-weekend">{t('family.weekend')}</h2>
                {best ? <p className="ms-widget-lead">{t('family.bestPark', { day: fmtWeekday(best.date, lang, 'long'), slot: t(`slots.${best.slot}`) })}</p> : null}
                <div className="ms-table-wrap" role="region" aria-labelledby="f-weekend" tabIndex={0}>
                  <table className="ms-table">
                    <thead>
                      <tr>
                        <th scope="col">{t('charts.day')}</th>
                        {['morning', 'afternoon', 'evening'].map((s) => <th key={s} scope="col">{t(`slots.${s}`)}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {plan.map((d) => (
                        <tr key={d.date}>
                          <th scope="row">{fmtWeekday(d.date, lang, 'long')}</th>
                          {d.slots.map((s) => (
                            <td key={s.slot}>{s.score} · {t(`verdicts.comfort.${comfortBand(s.score)}`)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
            <section className="ms-card" aria-labelledby="f-closure">
              <h2 id="f-closure">{t('family.closureTitle')}</h2>
              <p>{t('family.closureNote')}</p>
              <ExternalLink href="https://www.india.gov.in">{t('footer.nationalPortal')}</ExternalLink>
            </section>
          </>
        );
      }}
    </PersonaPage>
  );
}
