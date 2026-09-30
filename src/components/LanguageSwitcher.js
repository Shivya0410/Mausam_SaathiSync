"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(lang);
    }
  };

  const isHindi = i18n?.language?.startsWith('hi');

  return (
    <div
      style={{
        position: 'fixed',
        top: 14,
        right: 18,
        zIndex: 2000,
        display: 'flex',
        gap: 4,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: 24,
        padding: '4px 6px',
        boxShadow: '0 4px 14px rgba(38, 70, 166, 0.12)',
        border: '1.5px solid #6382BF',
      }}
    >
      <button
        onClick={() => changeLanguage('en')}
        style={{
          border: 'none',
          borderRadius: 18,
          padding: '4px 10px',
          fontSize: '0.75rem',
          fontWeight: !isHindi ? '800' : '600',
          backgroundColor: !isHindi ? '#2646A6' : 'transparent',
          color: !isHindi ? '#ffffff' : '#53647e',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        English
      </button>
      <button
        onClick={() => changeLanguage('hi')}
        style={{
          border: 'none',
          borderRadius: 18,
          padding: '4px 10px',
          fontSize: '0.75rem',
          fontWeight: isHindi ? '800' : '600',
          backgroundColor: isHindi ? '#2646A6' : 'transparent',
          color: isHindi ? '#ffffff' : '#53647e',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        हिंदी
      </button>
    </div>
  );
};

export default LanguageSwitcher;
