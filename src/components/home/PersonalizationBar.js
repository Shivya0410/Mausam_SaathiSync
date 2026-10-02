"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../lib/hooks/useStore';
import { stores, personasFromChoices, toggleChoice } from '../../lib/stores';

const INTERESTS = [
  { id: 'fitness', icon: 'fa-person-running', labelEn: 'Running & Jogging', labelHi: 'दौड़ व जॉगिंग' },
  { id: 'health', icon: 'fa-person-walking', labelEn: 'Walking & Outdoors', labelHi: 'सुबह की सैर' },
  { id: 'commute', icon: 'fa-motorcycle', labelEn: 'Commute & Travel', labelHi: 'आवागमन व दफ़्तर' },
  { id: 'farm', icon: 'fa-wheat-awn', labelEn: 'Farming & Garden', labelHi: 'खेती व बागवानी' },
  { id: 'family', icon: 'fa-children', labelEn: 'School / Kids Routine', labelHi: 'स्कूल व बच्चे' },
  { id: 'work', icon: 'fa-helmet-safety', labelEn: 'Outdoor & Gig Work', labelHi: 'बाहर का काम' },
  { id: 'events', icon: 'fa-champagne-glasses', labelEn: 'Events & Gathering', labelHi: 'आयोजन व समारोह' },
  { id: 'coast', icon: 'fa-water', labelEn: 'Beach & Sea', labelHi: 'समुद्र तट व तैराकी' },
];

export default function PersonalizationBar() {
  const { t, i18n } = useTranslation();
  const [personas, setPersonas] = useStore(stores.personas);
  const isHi = i18n.language === 'hi';

  const selectedIds = [
    personas.primary,
    ...(personas.secondary || []),
  ].filter(Boolean);

  const toggleInterest = (id) => {
    const nextList = toggleChoice(selectedIds, id, 3);
    setPersonas(personasFromChoices(nextList));
  };

  return (
    <section className="ms-personalization-bar" aria-labelledby="pers-title">
      <div className="ms-pers-header">
        <div className="ms-pers-title-group">
          <span className="ms-pers-icon-badge" aria-hidden="true">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </span>
          <div>
            <h3 id="pers-title" className="ms-pers-title">
              {isHi
                ? 'अपने काम व दिनचर्या चुनें — सुझाव खुद-ब-खुद बदलेंगे'
                : 'Tell us what you do outdoors to get tips made for you.'}
            </h3>
            <p className="ms-pers-subtitle">
              {isHi
                ? '1 से 3 गतिविधियां चुनें (तुरंत लाइव अपडेट)'
                : 'Tap to customize today’s recommendations dynamically'}
            </p>
          </div>
        </div>
      </div>

      <div className="ms-pers-chips" role="group" aria-label="Outdoor interests">
        {INTERESTS.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`ms-pers-chip ${isSelected ? 'is-selected' : ''}`}
              aria-pressed={isSelected}
              onClick={() => toggleInterest(item.id)}
            >
              <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
              <span>{isHi ? item.labelHi : item.labelEn}</span>
              {isSelected && <i className="fa-solid fa-check ms-pers-check" aria-hidden="true"></i>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
