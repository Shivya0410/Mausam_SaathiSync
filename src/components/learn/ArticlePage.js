"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import ListenButton from '../shared/ListenButton';
import { ARTICLE_BY_SLUG, ARTICLE_CHECKS, ARTICLES } from '../../data/learn';
import { useReady } from '../../lib/hooks/useReady';
import { markRead, recordQuiz } from '../../lib/mausam/ready';

function ArticleCheck({ slug }) {
  const { t } = useTranslation();
  const [state, update, fresh] = useReady();
  const qs = ARTICLE_CHECKS[slug];
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const passedBefore = state.quizzes?.[slug]?.passed;
  const submit = (e) => {
    e.preventDefault();
    const correct = qs.filter((q) => answers[q.id] === q.answer).length;
    const passed = correct === qs.length;
    setResult({ correct, passed });
    update((s) => recordQuiz(s, slug, { passed: passed || Boolean(s.quizzes?.[slug]?.passed), correct, at: new Date().toISOString() }));
  };
  return (
    <section className="ms-card" aria-labelledby="check-h">
      <h2 id="check-h">{t('learn.check.title')}</h2>
      {passedBefore && !result ? <p className="ms-muted">{t('learn.check.passedBefore')}</p> : null}
      <form onSubmit={submit} className="ms-form">
        {qs.map((q) => (
          <fieldset key={q.id} className="ms-fieldset">
            <legend>{t(`learn.check.${slug}.${q.id}.q`)}</legend>
            {q.options.map((o) => (
              <label key={o} className="ms-habit">
                <input type="radio" name={q.id} value={o} checked={answers[q.id] === o} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o }))} />
                <span>{t(`learn.check.${slug}.${q.id}.${o}`)}</span>
              </label>
            ))}
          </fieldset>
        ))}
        <button type="submit" className="ms-btn" disabled={Object.keys(answers).length < qs.length}>{t('learn.check.submit')}</button>
      </form>
      {result ? (
        <p role="status">
          {result.passed ? t('learn.check.pass') : t('learn.check.fail', { correct: result.correct, total: qs.length })}
          {fresh.includes('lightning_smart') ? ` ${t('learn.check.badge')}` : ''}
        </p>
      ) : null}
    </section>
  );
}

/** One Learn article (PRD 9.3, 21.1): structured text from the locale files. */
export default function ArticlePage({ slug }) {
  const { t } = useTranslation();
  const [, update] = useReady();
  const a = ARTICLE_BY_SLUG[slug];
  useEffect(() => {
    if (a) update((s) => markRead(s, slug, new Date().toISOString()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  if (!a) return null;
  const body = t(`learn.articles.${slug}.body`, { returnObjects: true });
  const paras = Array.isArray(body) ? body : [];
  const idx = ARTICLES.findIndex((x) => x.slug === slug);
  const next = ARTICLES[(idx + 1) % ARTICLES.length];
  return (
    <>
      <PageHeader title={t(`learn.articles.${slug}.title`)} subtitle={t(`learn.articles.${slug}.summary`)} />
      <article className="ms-card ms-article">
        <ListenButton text={[t(`learn.articles.${slug}.title`), ...paras].join('. ')} />
        {paras.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {a.sources.length ? (
          <p className="ms-muted">
            {t('learn.sources')}: {a.sources.join('; ')}
          </p>
        ) : null}
        <p className="ms-muted">{t('learn.reviewNote')}</p>
      </article>
      {ARTICLE_CHECKS[slug] ? <ArticleCheck slug={slug} /> : null}
      <nav className="ms-card" aria-label={t('learn.related')}>
        <h2>{t('learn.related')}</h2>
        <ul className="ms-link-list">
          {a.related.map((href) => (
            <li key={href}>
              <Link href={href} className="ms-chip ms-chip--link">{t(`learn.links.${href.replace(/[/#]/g, '_')}`)}</Link>
            </li>
          ))}
          <li><Link href="/learn" className="ms-chip ms-chip--link">{t('learn.all')}</Link></li>
          <li><Link href={`/learn/${next.slug}`} className="ms-chip ms-chip--link">{t('learn.next', { title: t(`learn.articles.${next.slug}.title`) })}</Link></li>
        </ul>
      </nav>
    </>
  );
}
