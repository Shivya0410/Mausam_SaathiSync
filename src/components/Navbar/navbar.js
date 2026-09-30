"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/auth';
import WhatsAppFloat from '../shared/WhatsAppFloat';
import ChatbotFloat from '../shared/ChatbotFloat';
import { ORIGINAL_NAV_ITEMS } from '../../config/navItems';
const audio2 = "/media/audio2.mp3";
import './navbar.css';

// Base items (incl. Profile) render for everyone, including Guest Mode.
// Logout is appended for signed-in users only. See src/config/navItems.js.
export default function Navbar() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  // Auth-aware: show a Logout entry only for signed-in users (no flash —
  // nothing renders until the client has read the stored token).
  const { isLoggedIN, isAuthReady } = useAuth();
  const navItems =
    isAuthReady && isLoggedIN
      ? [...ORIGINAL_NAV_ITEMS, { href: '/logout', icon: 'fa-solid fa-right-from-bracket', labelKey: 'nav.logout' }]
      : ORIGINAL_NAV_ITEMS;

  const toggleAudio = () => {
    const audioElement = document.getElementById('audioPlayer');
    if (!audioElement) return;

    if (isPlayingAudio) {
      audioElement.pause();
      setIsPlayingAudio(false);
    } else {
      audioElement.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.log('Audio playback error:', err);
      });
    }
  };

  return (
    <>
      <nav className="main-menu" aria-label={t('nav.menu')}>
        {/* Top Hamburger Icon */}
        <div className="sidebar-hamburger" title={t('nav.menu')}>
          <i className="fa-solid fa-bars"></i>
        </div>

        {/* Sidebar nav items with curvy-ends styling */}
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const label = t(item.labelKey);
            return (
              <li key={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Link href={item.href} title={label}>
                  <i className={item.icon}></i>
                  <span className="nav-text">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Ambient Serene Sound Toggle */}
        <button
          className="sidebar-zen-btn"
          onClick={toggleAudio}
          title={isPlayingAudio ? t('nav.zenPause') : t('nav.zenPlay')}
          aria-label="Toggle zen audio"
        >
          <i className={`fa-solid ${isPlayingAudio ? 'fa-pause' : 'fa-music'}`}></i>
          <span>{isPlayingAudio ? t('nav.pause') : t('nav.zen')}</span>
        </button>
        <audio id="audioPlayer" loop>
          <source src={audio2} type="audio/mp3" />
        </audio>

        {/* Bottom Legal Copyright */}
        <div className="sidebar-bottom-legal">
          <div>&copy; 2026 Swasth</div>
          <div>
            <Link href="/about">{t('nav.terms')}</Link> | <Link href="/about">{t('nav.privacy')}</Link>
          </div>
        </div>
      </nav>

        {/* Floating buttons (bottom-right, site-wide): chatbot above WhatsApp */}
        <ChatbotFloat />
        <WhatsAppFloat />
      </>
    );
  }
