"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/auth';
import './TopBar.css';

export default function TopBar({ onToggleSidebar, searchQuery = '', onSearchChange }) {
  const { t, i18n } = useTranslation();
  const { isLoggedIN, LogoutUser } = useAuth();

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const langRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setShowLangDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang) => {
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(lang);
    }
    setShowLangDropdown(false);
  };

  const currentLang = i18n?.language?.startsWith('hi') ? 'हिंदी' : 'English';
  const langFlag = i18n?.language?.startsWith('hi') ? '🇮🇳' : '🌐';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="topbar-menu-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <i className="fa fa-bars"></i>
        </button>

        <Link href="/" className="topbar-brand">
          <div className="topbar-brand-icon">
            <i className="fa-solid fa-infinity"></i>
          </div>
          <span className="topbar-brand-title">
            SWASTH<span>INFINITY</span>
          </span>
        </Link>
      </div>

      <div className="topbar-center">
        <Link href="/start" className="topbar-cta-pill">
          <span className="topbar-cta-badge">AI Wellness Coach</span>
          <span className="topbar-cta-divider">|</span>
          <span className="topbar-cta-action">
            Try it now <i className="fa fa-arrow-right"></i>
          </span>
        </Link>
      </div>

      <div className="topbar-right">
        {/* Language Picker */}
        <div className="topbar-lang-container" ref={langRef}>
          <button 
            className="topbar-lang-btn" 
            onClick={() => setShowLangDropdown((prev) => !prev)}
            aria-expanded={showLangDropdown}
          >
            <span>{langFlag}</span>
            <span>{currentLang}</span>
            <i className="fa fa-chevron-down" style={{ fontSize: '10px', marginLeft: 2 }}></i>
          </button>
          {showLangDropdown && (
            <div className="topbar-lang-dropdown">
              <button 
                className={`topbar-lang-item ${!i18n?.language?.startsWith('hi') ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                🌐 English
              </button>
              <button 
                className={`topbar-lang-item ${i18n?.language?.startsWith('hi') ? 'active' : ''}`}
                onClick={() => handleLanguageChange('hi')}
              >
                🇮🇳 हिंदी
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="topbar-search">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="Search activities, diets..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>

        {/* Profile / Account — name removed */}
        <div className="topbar-profile-container" ref={profileRef}>
          <button 
            className="topbar-profile-btn" 
            onClick={() => setShowProfileDropdown((prev) => !prev)}
            aria-label="User profile options"
          >
            <i className="fa fa-user"></i>
          </button>
          {showProfileDropdown && (
            <div className="topbar-profile-dropdown">
              {isLoggedIN ? (
                <>
                  <Link href="/profile" className="topbar-profile-link" onClick={() => setShowProfileDropdown(false)}>
                    <i className="fa fa-user-circle"></i> Profile & Goals
                  </Link>
                  <Link href="/tracker" className="topbar-profile-link" onClick={() => setShowProfileDropdown(false)}>
                    <i className="fa fa-chart-line"></i> Activity Tracker
                  </Link>
                  <button 
                    onClick={() => { LogoutUser(); setShowProfileDropdown(false); }}
                    className="topbar-profile-link"
                    style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <i className="fa fa-sign-out-alt"></i> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="topbar-profile-link" onClick={() => setShowProfileDropdown(false)}>
                    <i className="fa fa-sign-in-alt"></i> Login
                  </Link>
                  <Link href="/register" className="topbar-profile-link" onClick={() => setShowProfileDropdown(false)}>
                    <i className="fa fa-user-plus"></i> Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
