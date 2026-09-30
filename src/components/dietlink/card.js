"use client";

import React from 'react';
import './card.css';
import { useTranslation } from 'react-i18next';

function PlannerBanner() {
  const { t } = useTranslation();

  return (
    <div className="planner-hero">
      <h4 className="planner-hero-title">
        {t('card.title', { defaultValue: 'Food Recommendations' })}
      </h4>
      <p className="planner-hero-text">
        {t('card.text', {
          defaultValue:
            'Click on the below button to generate the food recommendations on the basis of Dietary Preferences and Fitness Regime.',
        })}
      </p>
      <button className="planner-hero-button">
        <a
          href="https://qdeatavs76ewyztuswrmsi.streamlit.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="planner-hero-link"
        >
          {t('card.button', { defaultValue: 'Generate' })}
        </a>
      </button>
    </div>
  );
}

export default PlannerBanner;
