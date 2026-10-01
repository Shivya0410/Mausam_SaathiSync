"use client";

import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LevelBadge from '../shared/LevelBadge';
import ListenButton from '../shared/ListenButton';
import Avatar from '../shared/Avatar';
import { cardText, cardSpeech } from '../../lib/mausam/cardText';

const CHIP_ICON = {
  umbrella: 'fa-umbrella', raincoat: 'fa-person-rays', water: 'fa-bottle-water', cap: 'fa-hat-cowboy',
  sunglasses: 'fa-glasses', sunscreen: 'fa-pump-soap', mask: 'fa-head-side-mask', jacket: 'fa-vest',
  torch: 'fa-lightbulb', charger: 'fa-plug', powerBank: 'fa-battery-full', firstAid: 'fa-kit-medical', phone: 'fa-phone',
};

/**
 * One decision card (PRD 5.6, 20.4). Official cards show the IMD level and
 * verbatim text and cannot be dismissed, only collapsed.
 *
 * @param {object} props
 * @param {object} props.card DecisionCard
 * @param {string} props.today
 * @param {Array} [props.members] household members this card is for
 * @param {string} [props.speechLang] language to read in (a member's)
 */
export default function DecisionCard({ card, today, members = [], feedback, onDismiss, onFeedback, speechLang, placeLabel }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const uid = useId();
  const [showWhy, setShowWhy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const txt = cardText(card, { t, lang, today });
  const official = card.kind === 'official';
  const speakT = speechLang && speechLang !== lang ? i18n.getFixedT(speechLang) : t;
  const speech = () => cardSpeech(cardText(card, { t: speakT, lang: speechLang || lang, today }));
  const headingId = `${uid}-h`;
  return (
    <article className={`ms-dcard ms-dcard--${card.kind} ${official ? `ms-dcard--${txt.level}` : ''}`} aria-labelledby={headingId}>
      <div className="ms-dcard-tag">
        {members.map((m) => (
          <span key={m.id} className="ms-member-tag">
            <Avatar seed={m.avatar || m.name} size={20} decorative /> {m.name}
          </span>
        ))}
        {official ? (
          <>
            <span className="ms-kind ms-kind--official">{t('cards.kind.official')}</span>
            <LevelBadge level={txt.level} withAction />
          </>
        ) : (
          <span className={`ms-kind ms-kind--${card.kind}`}>{t(`cards.kind.${card.kind}`)}</span>
        )}
        {placeLabel ? <span className="ms-muted">· {placeLabel}</span> : null}
      </div>
      <h3 id={headingId}>{txt.headline}</h3>
      {!collapsed ? (
        <>
          <p className="ms-dcard-reason" lang={official ? card.params.lang?.slice(0, 2) || (/[\u0900-\u097F]/.test(txt.reason) ? 'hi' : 'en') : undefined}>
            {txt.reason}
          </p>
          {official && lang === 'hi' && !/[\u0900-\u097F]/.test(txt.reason) ? <p className="ms-muted">{t('alerts.issuedInEnglish')}</p> : null}
          {official ? (
            <div className="ms-dcard-official">
              {txt.advice ? <p><strong>{txt.action}:</strong> {txt.advice}</p> : null}
              {txt.instruction ? <p>{txt.instruction}</p> : null}
              {txt.addOns.length ? (
                <ul className="ms-addons" aria-label={t('cards.alsoForYou')}>
                  {txt.addOns.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              ) : null}
              <p className="ms-muted">
                {txt.issuer}
                {txt.validTo ? ` · ${t('alerts.validTill', { time: txt.validTo })}` : ''}
              </p>
            </div>
          ) : null}
          {card.chips?.length ? (
            <ul className="ms-chips" aria-label={t('cards.chipsLabel')}>
              {card.chips.map((c) => (
                <li key={c} className="ms-chip">
                  <i className={`fa-solid ${CHIP_ICON[c] || 'fa-circle'}`} aria-hidden="true"></i> {t(`cards.chips.${c}`)}
                </li>
              ))}
            </ul>
          ) : null}
          {showWhy ? (
            <p className="ms-why" id={`${uid}-why`}>
              {txt.why}
            </p>
          ) : null}
        </>
      ) : null}
      <div className="ms-dcard-actions">
        {official ? (
          <button type="button" className="ms-chip-btn" aria-expanded={!collapsed} onClick={() => setCollapsed((v) => !v)}>
            <i className={`fa-solid ${collapsed ? 'fa-angle-down' : 'fa-angle-up'}`} aria-hidden="true"></i> {t(collapsed ? 'cards.expand' : 'cards.collapse')}
          </button>
        ) : null}
        <button type="button" className="ms-chip-btn" aria-expanded={showWhy} aria-controls={showWhy ? `${uid}-why` : undefined} onClick={() => setShowWhy((v) => !v)}>
          <i className="fa-solid fa-circle-question" aria-hidden="true"></i> {t('common.why')}
        </button>
        <ListenButton text={speech} lang={speechLang} />
        {onFeedback ? (
          <span className="ms-feedback" role="group" aria-label={t('common.helpful')}>
            <button type="button" className="ms-chip-btn" aria-pressed={feedback === true} onClick={() => onFeedback(card, true)} aria-label={t('cards.helpfulYes')}>
              <i className="fa-solid fa-thumbs-up" aria-hidden="true"></i>
            </button>
            <button type="button" className="ms-chip-btn" aria-pressed={feedback === false} onClick={() => onFeedback(card, false)} aria-label={t('cards.helpfulNo')}>
              <i className="fa-solid fa-thumbs-down" aria-hidden="true"></i>
            </button>
          </span>
        ) : null}
        {!official && onDismiss ? (
          <button type="button" className="ms-chip-btn" onClick={() => onDismiss(card)}>
            <i className="fa-solid fa-xmark" aria-hidden="true"></i> {t('common.dismiss')}
          </button>
        ) : null}
      </div>
    </article>
  );
}
