"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { WHATSAPP_LINK } from '../../services/config';
import './WhatsAppFloat.css';

// Site-wide WhatsApp button — official brand glyph, nothing else on it.
// Fixed bottom-right by default; `inline` renders it in normal flow
// (used in the tracker footer).
export default function WhatsAppFloat({ inline = false }) {
  const { t } = useTranslation();
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      className={inline ? 'wa-btn wa-inline' : 'wa-btn wa-fixed'}
      title={t('common.whatsapp')}
      aria-label={t('common.whatsapp')}
    >
      <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
    </a>
  );
}
