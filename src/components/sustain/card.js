"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import './card.css';

function Yoga() {
  const { t } = useTranslation();

  return (
    <div className='cards-in-set'>
      <div className="card10">
        <h4 className="card10-title">{t('cardSection.title1')}</h4>
        <p className="card10-text">{t('cardSection.text1')}</p>
        <button className="card10-button">
          <a
            href="https://huggingface.co/spaces/Manishikha/CarbonFootPrintCalculator"
            target="_blank"
            rel="noopener noreferrer"
            className="card10-link"
          >
            {t('cardSection.button1')}
          </a>
        </button>
      </div>
      <div className="card10">
        <h4 className="card10-title">{t('cardSection.title2')}</h4>
        <p className="card10-text">{t('cardSection.text2')}</p>
        <button className="card10-button">
          <a
            href="https://huggingface.co/spaces/Manishikha/Dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="card10-link"
          >
            {t('cardSection.button2')}
          </a>
        </button>
      </div>
    </div>
  );
}

export default Yoga;
