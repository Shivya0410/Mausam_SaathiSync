"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContentPage from './ContentPage';
import { sendFeedback } from '../../lib/reportsClient';

const CATEGORIES = ['bug', 'wrongWeather', 'suggestion', 'accessibility', 'other'];

/** Feedback (GIGW G10, PRD 15.3). Email optional, only with consent. */
export default function FeedbackPage() {
  const { t, i18n } = useTranslation();
  const [f, setF] = useState({ category: 'suggestion', message: '', email: '', consent: false });
  const [state, setState] = useState({ status: 'idle', ref: null, errors: {} });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!f.message.trim()) errors.message = t('gigw.feedback.errMessage');
    if (f.email && !f.consent) errors.consent = t('gigw.feedback.errConsent');
    if (Object.keys(errors).length) return setState({ status: 'idle', ref: null, errors });
    setState({ status: 'sending', ref: null, errors: {} });
    try {
      const r = await sendFeedback({
        kind: 'site',
        category: f.category,
        message: f.message.trim(),
        ...(f.email.trim() ? { email: f.email.trim(), consent: true } : {}),
        lang: i18n.language === 'hi' ? 'hi' : 'en',
        page: document.referrer ? new URL(document.referrer).pathname.slice(0, 120) : '/feedback',
      });
      setState({ status: 'done', ref: r.feedback?.id, errors: {} });
    } catch (err) {
      setState({ status: 'idle', ref: null, errors: { form: err.code === 'rate_limited' ? t('cv.errors.rateLimited') : err.fields?.email ? t('gigw.feedback.errEmail') : t('gigw.feedback.errSend') } });
    }
  };

  if (state.status === 'done') {
    return (
      <ContentPage page="feedback">
        <section className="ms-card" role="status">
          <h2><i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t('gigw.feedback.thanks')}</h2>
          <p>{t('gigw.feedback.reference', { ref: state.ref })}</p>
          <p><Link href="/">{t('common.goHome')}</Link></p>
        </section>
      </ContentPage>
    );
  }
  const err = state.errors;
  return (
    <ContentPage page="feedback">
      <form className="ms-card ms-form" onSubmit={submit} noValidate>
        <label className="ms-field">
          <span>{t('gigw.feedback.category')}</span>
          <select value={f.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`gigw.feedback.categories.${c}`)}</option>)}
          </select>
        </label>
        <label className="ms-field">
          <span>{t('gigw.feedback.message')}</span>
          <textarea
            rows={6}
            maxLength={1000}
            value={f.message}
            onChange={(e) => set('message', e.target.value)}
            aria-invalid={Boolean(err.message)}
            aria-describedby="fb-count fb-msg-err"
            required
          />
          <span id="fb-count" className="ms-muted">{t('gigw.feedback.count', { n: f.message.length })}</span>
          {err.message ? <span id="fb-msg-err" className="ms-error">{err.message}</span> : null}
        </label>
        <label className="ms-field">
          <span>{t('gigw.feedback.email')}</span>
          <input type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} aria-describedby="fb-email-help" />
          <span id="fb-email-help" className="ms-muted">{t('gigw.feedback.emailHelp')}</span>
        </label>
        {f.email ? (
          <label className="ms-habit">
            <input type="checkbox" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} aria-invalid={Boolean(err.consent)} aria-describedby="fb-consent-err" />
            <span>{t('gigw.feedback.consent')}</span>
          </label>
        ) : null}
        {err.consent ? <p id="fb-consent-err" className="ms-error">{err.consent}</p> : null}
        <p className="ms-muted">{t('gigw.feedback.noPersonal')}</p>
        {err.form ? <p className="ms-error" role="alert">{err.form}</p> : null}
        <button type="submit" className="ms-btn" disabled={state.status === 'sending'}>{state.status === 'sending' ? t('cv.sending') : t('gigw.feedback.send')}</button>
      </form>
    </ContentPage>
  );
}
