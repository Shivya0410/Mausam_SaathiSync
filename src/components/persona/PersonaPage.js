"use client";

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import DecisionCardList from '../home/DecisionCardList';
import { WIDGET_COMPONENTS } from '../widgets';
import LevelBadge from '../shared/LevelBadge';
import ExternalLink from '../shared/ExternalLink';
import SampleDataBadge from '../shared/SampleDataBadge';
import { usePersonal } from '../../lib/hooks/usePersonal';
import { useStore } from '../../lib/hooks/useStore';
import { stores, recordPageVisit, dismissCard, recordFeedback } from '../../lib/stores';
import { personalView } from '../../lib/mausam/personal';
import { levelName } from '../../lib/mausam/hazards';
import { fmtTime } from '../../lib/format';
import { GOV_SERVICES } from '../../data/govServices';

/**
 * Persona view for a page: the page's persona leads, and the user's own
 * sensitivities apply. `snapshot` overrides the current place (a beach, a
 * farm). Pure data work; memoised by the caller.
 */
export function usePersonaView(persona, snapshot) {
  const personal = usePersonal();
  const [sens] = useStore(stores.sensitivities);
  const view = useMemo(() => {
    const inputs = personal.inputs;
    if (!inputs) return null;
    const snap = snapshot || inputs.snapshot;
    const extra = personal.personas.filter((p) => p.id !== persona && p.id !== 'citizen').map((p) => ({ id: p.id, role: 'secondary' }));
    return personalView({ ...inputs, snapshot: snap, personas: [{ id: persona, role: 'primary' }, ...extra], sensitivities: sens.list });
  }, [personal.inputs, personal.personas, snapshot, persona, sens.list]);
  const env = { today: personal.today, now: personal.now, snapshot: snapshot || personal.snapshot, personal, coolSpots: personal.coolSpots };
  return { view, env, personal };
}

/** Renders registered widgets by id, full width inside a section grid. */
export function Widgets({ ids, view, env }) {
  if (!view) return <div className="ms-skeleton"></div>;
  return (
    <div className="ms-grid">
      {ids.map((id) => {
        const W = WIDGET_COMPONENTS[id];
        return W ? (
          <div key={id} className="ms-grid-item ms-span--half">
            <W view={view} env={env} />
          </div>
        ) : null;
      })}
    </div>
  );
}

/**
 * The shared persona page template (PRD section 8): header with place and
 * time, official warnings, all of this persona's decision cards, the hero
 * widget, supporting widgets, extra sections, learn links, services.
 */
export default function PersonaPage({ persona, pageKey, snapshot, hero, widgets = [], children, services = [], learn = [], disclaimerKey, placeLabel }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { view, env } = usePersonaView(persona, snapshot);
  const [, setUsage] = useStore(stores.usage);
  const [cardState, setCardState] = useStore(stores.cardState);

  useEffect(() => {
    setUsage((u) => recordPageVisit(u, persona));
  }, [persona, setUsage]);

  const snap = env.snapshot;
  const place = placeLabel || (lang === 'hi' && snap?.place?.nameHi ? snap.place.nameHi : snap?.place?.name);
  const official = view ? view.cards.filter((c) => c.kind === 'official') : [];
  const mine = view
    ? view.cards.filter((c) => c.kind !== 'official' && (c.personas?.includes(persona) || c.ruleId.startsWith(`${persona}.`)))
    : [];
  const placeId = snap?.place?.id;
  const HeroWidget = hero ? WIDGET_COMPONENTS[hero] : null;
  const svc = GOV_SERVICES.filter((s) => services.includes(s.id));

  return (
    <>
      <PageHeader
        title={t(`pages.${pageKey}.title`)}
        subtitle={t(`pages.${pageKey}.subtitle`)}
        chipIcon="fa-solid fa-location-dot"
        chipText={snap ? `${place || ''} · ${t('common.updated', { time: fmtTime(snap.current?.updatedAt, lang) })}` : undefined}
      />
      {snap?.isDemo ? <p><SampleDataBadge variant="demo" /></p> : null}

      {official.length ? (
        <section className="ms-card" aria-labelledby="p-official">
          <h2 id="p-official">{t('persona.officialFor', { place: place || '' })}</h2>
          <ul className="ms-list ms-list--plain">
            {official.map((c) => (
              <li key={c.id}>
                <LevelBadge level={levelName(c.params.level)} withAction /> {t(`hazards.${c.params.hazard}`, { defaultValue: c.params.title })}
                {c.params.area ? ` · ${c.params.area}` : ''}
              </li>
            ))}
          </ul>
          <Link href="/alerts">{t('persona.allAlerts')}</Link>
        </section>
      ) : null}

      {view ? (
        <DecisionCardList
          entries={mine.map((card) => ({ card }))}
          today={env.today}
          maxVisible={mine.length || 1}
          title={t('persona.cards')}
          feedback={cardState?.[env.today]?.feedback || {}}
          onDismiss={(card) => setCardState((s) => dismissCard(s, env.today, placeId, card.ruleId))}
          onFeedback={(card, helpful) => setCardState((s) => recordFeedback(s, env.today, card.id, helpful))}
        />
      ) : (
        <div className="ms-skeleton"></div>
      )}
      {view && !mine.length ? <p className="ms-muted">{t('persona.noCards')}</p> : null}

      {HeroWidget && view ? (
        <div className="ms-hero">
          <HeroWidget view={view} env={env} hero />
        </div>
      ) : null}

      {widgets.length ? <Widgets ids={widgets} view={view} env={env} /> : null}

      {typeof children === 'function' ? children({ view, env }) : children}

      {learn.length ? (
        <section className="ms-card" aria-labelledby="p-learn">
          <h2 id="p-learn">{t('persona.learnMore')}</h2>
          <ul className="ms-list">
            {learn.map((k) => (
              <li key={k}>
                <Link href="/learn">{t(`learnTitles.${k}`)}</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {svc.length ? (
        <section className="ms-card" aria-labelledby="p-services">
          <h2 id="p-services">{t('persona.services')}</h2>
          <ul className="ms-list">
            {svc.map((s) => (
              <li key={s.id}>
                <ExternalLink href={s.url}>{t(`gov.services.${s.id}.name`)}</ExternalLink> · <span className="ms-muted">{t(`gov.services.${s.id}.desc`)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {disclaimerKey ? <p className="ms-disclaimer">{t(disclaimerKey)}</p> : null}
    </>
  );
}
