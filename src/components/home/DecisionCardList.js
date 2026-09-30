"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DecisionCard from './DecisionCard';
import { stableOrder } from '../../lib/mausam/cardText';

/**
 * "Today for you" (PRD 5.6, 20.4): official first, up to `maxVisible`
 * expanded, then "See all (n)". Order stays stable within a session.
 * `entries`: [{ card, members?, placeLabel?, speechLang? }]
 */
export default function DecisionCardList({ entries, today, maxVisible = 3, title, feedback = {}, onDismiss, onFeedback }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [prev, setPrev] = useState([]);
  const cards = entries.map((e) => e.card);
  const ordered = stableOrder(prev, cards);
  const signature = ordered.map((c) => `${c.id}:${c.severity}`).join('|');
  if (signature !== prev.map((p) => `${p.id}:${p.severity}`).join('|')) {
    // Remember this order for the next refresh (setState during render with
    // a guard: React's "store information from previous renders" pattern).
    setPrev(ordered.map((c) => ({ id: c.id, severity: c.severity })));
  }
  const byId = new Map(entries.map((e) => [e.card.id, e]));
  const list = ordered.map((c) => byId.get(c.id));
  const officialCount = list.filter((e) => e.card.kind === 'official').length;
  const limit = Math.max(maxVisible, officialCount);
  const shown = expanded ? list : list.slice(0, limit);
  return (
    <section className="ms-cards" aria-labelledby="today-title">
      <h2 id="today-title">{title || t('home.todayForYou')}</h2>
      <div className="ms-card-stack">
        {shown.map((e) => (
          <DecisionCard
            key={`${e.card.id}:${(e.members || []).map((m) => m.id).join(',')}`}
            card={e.card}
            members={e.members}
            placeLabel={e.placeLabel}
            speechLang={e.speechLang}
            today={today}
            feedback={feedback[e.card.id]}
            onDismiss={onDismiss}
            onFeedback={onFeedback}
          />
        ))}
      </div>
      {list.length > limit ? (
        <button type="button" className="ms-link-btn" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? t('cards.showFewer') : t('common.seeAll', { count: list.length })}
        </button>
      ) : null}
    </section>
  );
}
