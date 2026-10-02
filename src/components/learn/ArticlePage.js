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
  const [ready, update] = useReady();
  const a = ARTICLE_BY_SLUG[slug];

  useEffect(() => {
    if (a) update((s) => markRead(s, slug, new Date().toISOString()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!a) return null;

  const isBookmarked = Boolean(ready?.bookmarks?.[slug]);
  const body = t(`learn.articles.${slug}.body`, { returnObjects: true });
  const paras = Array.isArray(body) ? body : [];
  const idx = ARTICLES.findIndex((x) => x.slug === slug);
  const next = ARTICLES[(idx + 1) % ARTICLES.length];

  const handleBookmarkToggle = () => {
    update((s) => toggleBookmark(s, slug));
  };

  return (
    <>
      <PageHeader title={t(`learn.articles.${slug}.title`)} subtitle={t(`learn.articles.${slug}.summary`)} />

      {/* Article Top Action & Meta Bar */}
      <div className="ms-article-action-bar">
        <div className="ms-article-meta-tags">
          <span className={`ms-learn-tag ms-learn-tag--${a.theme || 'purple'}`}>
            <i className={`${a.icon}`} aria-hidden="true"></i> {a.tag || a.category}
          </span>
          <span className="ms-learn-readtime">
            <i className="fa-regular fa-clock" aria-hidden="true"></i> {a.readTime || '2 min read'}
          </span>
          <span className="ms-learn-status-badge ms-learn-status-badge--read">
            <i className="fa-solid fa-circle-check" aria-hidden="true"></i> Read & Completed
          </span>
        </div>

        <button
          type="button"
          onClick={handleBookmarkToggle}
          className={`ms-btn ms-article-bookmark-btn ${isBookmarked ? 'is-active' : ''}`}
        >
          <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark`} aria-hidden="true"></i>
          <span>{isBookmarked ? 'Bookmarked' : 'Bookmark Guide'}</span>
        </button>
      </div>

      <article className="ms-card ms-article ms-article-enhanced">
        <div className="ms-article-listen-wrap">
          <ListenButton text={[t(`learn.articles.${slug}.title`), ...paras].join('. ')} />
        </div>
        <div className="ms-article-content">
          {paras.map((p, i) => (
            <p key={i} className="ms-article-para">{p}</p>
          ))}
        </div>
        {a.sources.length ? (
          <div className="ms-article-sources-box">
            <span className="ms-article-sources-title">
              <i className="fa-solid fa-building-columns" aria-hidden="true"></i> {t('learn.sources')}:
            </span>
            <span className="ms-muted">{a.sources.join(' · ')}</span>
          </div>
        ) : null}
        <p className="ms-muted ms-article-review-note">{t('learn.reviewNote')}</p>
      </article>

      {ARTICLE_CHECKS[slug] ? <ArticleCheck slug={slug} /> : null}

      <nav className="ms-card ms-article-nav" aria-label={t('learn.related')}>
        <h2>{t('learn.related')}</h2>
        <ul className="ms-link-list">
          {a.related.map((href) => (
            <li key={href}>
              <Link href={href} className="ms-chip ms-chip--link">{t(`learn.links.${href.replace(/[/#]/g, '_')}`)}</Link>
            </li>
          ))}
          <li><Link href="/learn" className="ms-chip ms-chip--link"><i className="fa-solid fa-arrow-left" aria-hidden="true"></i> {t('learn.all')}</Link></li>
          <li><Link href={`/learn/${next.slug}`} className="ms-chip ms-chip--link ms-chip--primary">{t('learn.next', { title: t(`learn.articles.${next.slug}.title`) })} <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></Link></li>
        </ul>
      </nav>
    </>
  );
}
