"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import MythQuiz from './MythQuiz';
import { ARTICLES } from '../../data/learn';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';

/** Learn (PRD 9.3): 12 short articles and the weather myths quiz. */
export default function LearnIndex() {
  const { t } = useTranslation();
  const [ready] = useStore(stores.ready);
  return (
    <>
      <PageHeader title={t('pages.learn.title')} subtitle={t('pages.learn.subtitle')} />
      <ul className="ms-learn-list">
        {ARTICLES.map((a) => (
          <li key={a.slug}>
            <Link href={`/learn/${a.slug}`} className="ms-card ms-learn-card">
              <i className={`${a.icon} ms-learn-icon`} aria-hidden="true"></i>
              <span>
                <strong>{t(`learn.articles.${a.slug}.title`)}</strong>
                <span className="ms-muted">{t(`learn.articles.${a.slug}.summary`)}</span>
                {ready.read?.[a.slug] ? <span className="ms-kind ms-kind--good">{t('learn.read')}</span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="ms-card" aria-labelledby="myths">
        <h2 id="myths">{t('learn.quiz.title')}</h2>
        <p className="ms-muted">{t('learn.quiz.intro')}</p>
        <MythQuiz />
      </section>
    </>
  );
}
