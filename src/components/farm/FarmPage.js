"use client";

import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import { Tips, ChipGroup } from '../persona/Sections';
import ListenButton from '../shared/ListenButton';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { sprayWindow } from '../../lib/mausam/indices/farm';
import { fmtTime } from '../../lib/format';

/** Farm and garden (PRD 8.6): rain, advisory, spraying, soil, frost, planting. */
export default function FarmPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [settings, setSettings] = useStore(stores.personaSettings);
  const role = settings.farm.role;
  return (
    <PersonaPage
      persona="farm"
      pageKey="farm"
      hero="rain5Day"
      widgets={['agromet', 'sprayWindow', 'soil', 'frostHail', 'humidityHeat', 'lightning', 'plantingGuide']}
      services={['meghdoot', 'pmkisan', 'pmfby', 'enam']}
      learn={['frostHail', 'lightning', 'rainChance']}
    >
      {({ view, env }) => {
        const w = view && env.today ? sprayWindow(view.ctx.hourly, env.today) : null;
        const days5 = view ? view.ctx.daily.filter((d) => d.date >= env.today).slice(0, 5) : [];
        const listen = () =>
          [
            t('widgets.rain5Day.summary', { mm: Math.round(days5.reduce((s, d) => s + d.precipMm, 0)) }),
            env.snapshot?.agromet?.text,
            w ? t('widgets.sprayWindow.window', { start: fmtTime(w.start, lang), end: fmtTime(w.end, lang) }) : t('widgets.sprayWindow.none'),
          ]
            .filter(Boolean)
            .join('. ');
        return (
          <>
            <section className="ms-card" aria-labelledby="fm-role">
              <h2 id="fm-role">{t('farm.you')}</h2>
              <ChipGroup
                label={t('farm.you')}
                options={['farmer', 'gardener'].map((r) => ({ value: r, label: t(`farmRoles.${r}`) }))}
                value={role}
                onChange={(v) => setSettings((s) => ({ ...s, farm: { ...s.farm, role: v } }))}
              />
              <ListenButton text={listen} label={t('farm.listen')} />
            </section>
            <Tips id="fm-lightning" titleKey="farm.lightningTitle" listKey="farm.lightningTips" icon="fa-solid fa-bolt" footerKey="farm.tipsSource" />
            <Tips id="fm-livestock" titleKey="farm.livestockTitle" listKey="farm.livestockTips" icon="fa-solid fa-cow" />
          </>
        );
      }}
    </PersonaPage>
  );
}
