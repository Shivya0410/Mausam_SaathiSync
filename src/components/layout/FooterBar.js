"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import './FooterBar.css';

export default function FooterBar() {
  const { t } = useTranslation();
  return (
    <footer className="footer-bar">
      <div className="footer-left">
        <span className="footer-copyright">
          {t('footer.copyright')}
        </span>
        <div className="footer-links">
          <Link href="/about">{t('footer.terms')}</Link>
          <span>|</span>
          <Link href="/about">{t('footer.privacyPolicy')}</Link>
          <span>|</span>
          <a href="/contracts/api-v1.md" target="_blank" rel="noreferrer">API</a>
          <span>|</span>
          <Link href="/about">{t('footer.about')}</Link>
        </div>
      </div>

      <div className="footer-center">
        {/* App Store Badge */}
        <a href="#app-store" className="store-badge" aria-label={t('footer.appStore')}>
          <i className="fa-brands fa-apple"></i>
          <div className="store-badge-text">
            <span className="store-badge-sub">{t('footer.downloadOn')}</span>
            <span className="store-badge-main">App Store</span>
          </div>
        </a>

        {/* Google Play Badge */}
        <a href="#google-play" className="store-badge" aria-label={t('footer.playStore')}>
          <i className="fa-brands fa-google-play"></i>
          <div className="store-badge-text">
            <span className="store-badge-sub">{t('footer.getItOn')}</span>
            <span className="store-badge-main">Google Play</span>
          </div>
        </a>
      </div>

      <div className="footer-right">
        <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="YouTube">
          <i className="fa-brands fa-youtube"></i>
        </a>
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Instagram">
          <i className="fa-brands fa-instagram"></i>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Twitter">
          <i className="fa-brands fa-x-twitter"></i>
        </a>
        <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social-icon" aria-label="Facebook">
          <i className="fa-brands fa-facebook-f"></i>
        </a>
      </div>
    </footer>
  );
}
