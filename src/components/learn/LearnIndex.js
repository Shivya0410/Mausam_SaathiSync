"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import MythQuiz from './MythQuiz';
import { ARTICLES } from '../../data/learn';
import { useReady } from '../../lib/hooks/useReady';
import { toggleBookmark } from '../../lib/mausam/ready';

/**
 * Learn (PRD 9.3): 12 short guides with progress meter, bookmarks,
 * vibrant category tags, and the interactive weather myths quiz.
 */
export default function LearnIndex() {
  const { t } = useTranslation();
  const [ready, update] = useReady();
  const [activeTab, setActiveTab] = useState('all');

  const readCount = useMemo(() => {
    return Object.keys(ready?.read || {}).filter((slug) => ARTICLES.some((a) => a.slug === slug)).length;
  }, [ready?.read]);

  const bookmarkCount = useMemo(() => {
    return Object.keys(ready?.bookmarks || {}).filter((slug) => ARTICLES.some((a) => a.slug === slug)).length;
  }, [ready?.bookmarks]);

  const percent = Math.round((readCount / ARTICLES.length) * 100);

  const filteredArticles = useMemo(() => {
    if (activeTab === 'bookmarked') {
      return ARTICLES.filter((a) => ready?.bookmarks?.[a.slug]);
    }
    if (activeTab === 'read') {
      return ARTICLES.filter((a) => ready?.read?.[a.slug]);
    }
    if (activeTab === 'safety') {
      return ARTICLES.filter((a) => ['safety', 'alerts'].includes(a.category));
    }
    if (activeTab === 'health') {
      return ARTICLES.filter((a) => ['health', 'travel', 'daily', 'farm'].includes(a.category));
    }
    return ARTICLES;
  }, [activeTab, ready?.bookmarks, ready?.read]);

  const handleBookmarkToggle = (e, slug) => {
    e.preventDefault();
    e.stopPropagation();
    update((s) => toggleBookmark(s, slug));
  };

  return (
    <>
      <PageHeader title={t('pages.learn.title')} subtitle={t('pages.learn.subtitle')} />

      {/* Progress & Milestone Overview */}
      <section className="ms-card ms-learn-progress-card">
        <div className="ms-learn-progress-head">
          <div className="ms-learn-progress-title-box">
            <span className="ms-learn-trophy">🏆</span>
            <div>
              <h2 className="ms-learn-progress-title">Your Weather Readiness Journey</h2>
              <p className="ms-muted ms-learn-progress-sub">
                {readCount === ARTICLES.length
                  ? "🎉 Mastered! You've completed all 12 weather safety guides!"
                  : `${readCount} of ${ARTICLES.length} guides read (${percent}% completed)`}
              </p>
            </div>
          </div>
          <div className="ms-learn-stat-badges">
            <span className="ms-learn-stat-pill">
              <i className="fa-solid fa-bookmark" aria-hidden="true"></i> {bookmarkCount} Saved
            </span>
            <span className="ms-learn-stat-pill ms-learn-stat-pill--green">
              <i className="fa-solid fa-check-double" aria-hidden="true"></i> {readCount} Read
            </span>
          </div>
        </div>

        <div className="ms-learn-bar-track">
          <div
            className="ms-learn-bar-fill"
            style={{ width: `${Math.max(percent, 4)}%` }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span className="ms-learn-bar-sparkle"></span>
          </div>
        </div>
      </section>

      {/* Interactive Category Filter Pills */}
      <div className="ms-learn-tabs" role="tablist" aria-label="Filter guides">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`ms-learn-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <i className="fa-solid fa-compass" aria-hidden="true"></i> All Guides ({ARTICLES.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'bookmarked'}
          className={`ms-learn-tab-btn ${activeTab === 'bookmarked' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('bookmarked')}
        >
          <i className="fa-solid fa-bookmark" aria-hidden="true"></i> Bookmarked ({bookmarkCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'read'}
          className={`ms-learn-tab-btn ${activeTab === 'read' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('read')}
        >
          <i className="fa-solid fa-circle-check" aria-hidden="true"></i> Read ({readCount})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'safety'}
          className={`ms-learn-tab-btn ${activeTab === 'safety' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('safety')}
        >
          <i className="fa-solid fa-shield-halved" aria-hidden="true"></i> Safety & Disaster
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'health'}
          className={`ms-learn-tab-btn ${activeTab === 'health' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <i className="fa-solid fa-heart-pulse" aria-hidden="true"></i> Health & Daily
        </button>
      </div>

      {/* Guides Grid */}
      {filteredArticles.length === 0 ? (
        <div className="ms-card ms-learn-empty-card">
          <i className="fa-regular fa-bookmark ms-learn-empty-icon" aria-hidden="true"></i>
          <h3>No bookmarked guides yet</h3>
          <p className="ms-muted">Tap the bookmark icon on any guide card below to save it here for quick reference.</p>
          <button type="button" className="ms-btn ms-btn--secondary" onClick={() => setActiveTab('all')}>
            Browse All Guides
          </button>
        </div>
      ) : (
        <ul className="ms-learn-grid">
          {filteredArticles.map((a) => {
            const isRead = Boolean(ready?.read?.[a.slug]);
            const isBookmarked = Boolean(ready?.bookmarks?.[a.slug]);

            return (
              <li key={a.slug} className="ms-learn-grid-item">
                <Link
                  href={`/learn/${a.slug}`}
                  className={`ms-card ms-learn-card ms-learn-card--${a.theme || 'purple'} ${isRead ? 'is-read' : ''}`}
                >
                  {/* Top Meta Bar */}
                  <div className="ms-learn-card-top">
                    <span className={`ms-learn-tag ms-learn-tag--${a.theme || 'purple'}`}>
                      {a.tag || a.category}
                    </span>
                    <div className="ms-learn-top-actions">
                      <span className="ms-learn-readtime">
                        <i className="fa-regular fa-clock" aria-hidden="true"></i> {a.readTime || '2 min'}
                      </span>
                      <button
                        type="button"
                        className={`ms-bookmark-btn ${isBookmarked ? 'is-bookmarked' : ''}`}
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this guide'}
                        aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark this guide'}
                        onClick={(e) => handleBookmarkToggle(e, a.slug)}
                      >
                        <i className={`fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark`} aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>

                  {/* Main Content & Animated Icon */}
                  <div className="ms-learn-card-body">
                    <div className={`ms-learn-icon-box ms-learn-icon-box--${a.theme || 'purple'}`}>
                      <i className={`${a.icon}`} aria-hidden="true"></i>
                    </div>
                    <div className="ms-learn-card-text">
                      <strong className="ms-learn-card-title">{t(`learn.articles.${a.slug}.title`)}</strong>
                      <p className="ms-muted ms-learn-card-summary">{t(`learn.articles.${a.slug}.summary`)}</p>
                    </div>
                  </div>

                  {/* Card Footer: Status Badge & Read CTA */}
                  <div className="ms-learn-card-foot">
                    {isRead ? (
                      <span className="ms-learn-status-badge ms-learn-status-badge--read">
                        <i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t('learn.read')}
                      </span>
                    ) : (
                      <span className="ms-learn-status-badge ms-learn-status-badge--unread">
                        <i className="fa-regular fa-circle" aria-hidden="true"></i> Unread
                      </span>
                    )}
                    <span className="ms-learn-cta">
                      Read Guide <i className="fa-solid fa-arrow-right ms-learn-cta-arrow" aria-hidden="true"></i>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Weather Myths Quiz Section */}
      <section className="ms-card ms-quiz-section" aria-labelledby="myths">
        <div className="ms-quiz-header">
          <div className="ms-quiz-badge-icon">
            <i className="fa-solid fa-brain" aria-hidden="true"></i>
          </div>
          <div>
            <h2 id="myths" className="ms-quiz-title">{t('learn.quiz.title')}</h2>
            <p className="ms-muted ms-quiz-sub">{t('learn.quiz.intro')}</p>
          </div>
        </div>
        <MythQuiz />
      </section>
    </>
  );
}
