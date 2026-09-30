"use client";

import { useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Avatar from '../shared/Avatar';

/**
 * "For: Everyone · Me · Papa · Dadi" (PRD 3.6, 20.13). A radio group:
 * arrow keys move the selection; only the selected option is in tab order.
 */
export default function MemberSwitcher({ members, selected, onSelect }) {
  const { t } = useTranslation();
  const refs = useRef([]);
  const options = [
    { id: 'everyone', name: t('household.everyone') },
    { id: 'me', name: t('household.me') },
    ...members,
  ];
  const idx = Math.max(0, options.findIndex((o) => o.id === selected));
  const onKey = (e) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const j = (idx + delta + options.length) % options.length;
    onSelect(options[j].id);
    refs.current[j]?.focus();
  };
  return (
    <div className="ms-members">
      <span id="members-label" className="ms-members-label">{t('household.showFor')}</span>
      <div role="radiogroup" aria-labelledby="members-label" onKeyDown={onKey} className="ms-members-list">
        {options.map((o, i) => (
          <button
            key={o.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={i === idx}
            tabIndex={i === idx ? 0 : -1}
            className="ms-member-opt"
            onClick={() => onSelect(o.id)}
          >
            {o.avatar || o.id.startsWith('m-') ? <Avatar seed={o.avatar || o.name} size={24} decorative /> : <i className={`fa-solid ${o.id === 'everyone' ? 'fa-people-roof' : 'fa-user'}`} aria-hidden="true"></i>}
            {o.name}
          </button>
        ))}
      </div>
      <Link href="/household" className="ms-chip ms-chip--link">
        <i className="fa-solid fa-plus" aria-hidden="true"></i> {t('household.add')}
      </Link>
    </div>
  );
}
