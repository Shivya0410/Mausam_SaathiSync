"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContentPage from './ContentPage';
import { EMERGENCY_NUMBERS } from '../../data/emergencyNumbers';

export const FAQ_IDS = [
  'numbers', 'rainChance', 'pollen', 'location', 'family', 'skySnap', 'report', 'alerts', 'language', 'textSize', 'offline', 'demo', 'tips', 'delete', 'who',
];

/** Help (PRD 15.3): getting started, 15 FAQs, emergency numbers. */
export default function HelpPage() {
  const { t } = useTranslation();
  const steps = t('gigw.help.start.items', { returnObjects: true });
  return (
    <ContentPage page="help">
      <section className="ms-card" aria-labelledby="help-start">
        <h2 id="help-start">{t('gigw.help.start.title')}</h2>
        <ol className="ms-steps">{(Array.isArray(steps) ? steps : []).map((s) => <li key={s}>{s}</li>)}</ol>
      </section>
      <section className="ms-card" aria-labelledby="help-faq">
        <h2 id="help-faq">{t('gigw.help.faqTitle')}</h2>
        {FAQ_IDS.map((id) => (
          <details key={id} className="ms-faq">
            <summary>{t(`gigw.help.faq.${id}.q`)}</summary>
            <p>{t(`gigw.help.faq.${id}.a`)}</p>
          </details>
        ))}
      </section>
      <section className="ms-card" aria-labelledby="help-emergency">
        <h2 id="help-emergency">{t('alerts.emergency')}</h2>
        <ul className="ms-emergency">
          {EMERGENCY_NUMBERS.map((n) => (
            <li key={n.number}>
              <a href={`tel:${n.number}`} className="ms-chip-btn">
                <i className="fa-solid fa-phone" aria-hidden="true"></i> {n.number} · {t(`emergency.${n.key}`)}
              </a>
            </li>
          ))}
        </ul>
        <p className="ms-muted">{t('alerts.verifyNumbers')}</p>
      </section>
      <p>
        <Link href="/feedback">{t('gigw.help.stillStuck')}</Link>
      </p>
    </ContentPage>
  );
}
