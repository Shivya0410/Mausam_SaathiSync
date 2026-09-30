"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import './RightFilterPanel.css';

const FILTER_ITEMS = [
  { id: 'featured', label: 'Featured', icon: 'fa-star' },
  { id: 'yoga', label: 'Yoga Poses', icon: 'fa-person-praying' },
  { id: 'calorie', label: 'Calorie Counter', icon: 'fa-fire' },
  { id: 'risk', label: 'Health Risk AI', icon: 'fa-heart-pulse' },
  { id: 'meditation', label: 'Meditation', icon: 'fa-spa' },
  { id: 'sustain', label: 'Virtual Forest', icon: 'fa-tree' },
  { id: 'shefit', label: 'SheFit Portal', icon: 'fa-venus' },
  { id: 'diet', label: 'Diet Recipes', icon: 'fa-apple-whole' },
  { id: 'running', label: 'Cardio & Run', icon: 'fa-person-running' },
  { id: 'tennis', label: 'Tennis Sports', icon: 'fa-baseball' },
  { id: 'recovery', label: 'Recovery', icon: 'fa-hand-holding-heart' },
  { id: 'strength', label: 'Bodyweight', icon: 'fa-dumbbell' },
];

export default function RightFilterPanel({
  selectedCategories = ['featured'],
  onToggleCategory,
  gender = 'male',
  onGenderChange,
  level = 'beginner',
  onLevelChange,
  focus = 'joints',
  onFocusChange,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showInsight, setShowInsight] = useState(true);

  const handleCheckbox = (id) => {
    if (onToggleCategory) {
      onToggleCategory(id);
    }
  };

  return (
    <aside className="right-filter-panel" aria-label="Filters and options">
      {/* Top Toggle Bar */}
      <div className="filter-toggles-bar">
        {/* Gender Toggle */}
        <div className="toggle-group">
          <button
            className={`switch-pill ${gender === 'female' ? 'active' : ''}`}
            onClick={() => onGenderChange && onGenderChange(gender === 'male' ? 'female' : 'male')}
            aria-label="Toggle gender filter"
          >
            <div className="switch-thumb"></div>
          </button>
          <span className="toggle-label">
            <i className={`fa-solid ${gender === 'male' ? 'fa-mars' : 'fa-venus'}`}></i>{' '}
            {gender === 'male' ? 'Male' : 'Female'}
          </span>
        </div>

        {/* Level Toggle */}
        <div className="toggle-group">
          <button
            className={`switch-pill ${level === 'advanced' ? 'active' : ''}`}
            onClick={() => onLevelChange && onLevelChange(level === 'beginner' ? 'advanced' : 'beginner')}
            aria-label="Toggle experience level"
          >
            <div className="switch-thumb"></div>
          </button>
          <span className="toggle-label">
            {level === 'beginner' ? 'Beginner' : 'Advanced'}
          </span>
        </div>

        {/* Focus Toggle */}
        <div className="toggle-group">
          <button
            className={`switch-pill ${focus === 'posture' ? 'active' : ''}`}
            onClick={() => onFocusChange && onFocusChange(focus === 'joints' ? 'posture' : 'joints')}
            aria-label="Toggle wellness focus"
          >
            <div className="switch-thumb"></div>
          </button>
          <span className="toggle-label">
            {focus === 'joints' ? 'Joints' : 'Posture'}
          </span>
        </div>
      </div>

      {/* Categories & Modules Section */}
      <div className="filter-section-header">
        <h3>Wellness Focus & Equipment</h3>
        <button
          className="filter-collapse-btn"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label="Collapse filters"
        >
          {collapsed ? '+' : '—'}
        </button>
      </div>

      {!collapsed && (
        <div className="filter-checkbox-grid">
          {FILTER_ITEMS.map((item) => {
            const isChecked = selectedCategories.includes(item.id);
            return (
              <label key={item.id} className="filter-checkbox-item">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckbox(item.id)}
                />
                <i className={`fa-solid ${item.icon} filter-item-icon`}></i>
                <span>{item.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* Daily Wellness Insight (styled after the reference bottom card) */}
      {showInsight && (
        <div className="filter-insight-card">
          <button
            className="filter-insight-dismiss"
            onClick={() => setShowInsight(false)}
            aria-label="Dismiss wellness tip"
          >
            &times; Dismiss
          </button>
          <div className="filter-insight-tag">
            <i className="fa-solid fa-lightbulb"></i> Daily Insight
          </div>
          <div className="filter-insight-title">
            POSTURE & RESPIRATION
          </div>
          <div className="filter-insight-body">
            Practicing 10 minutes of Pranayama and Bhujangasana increases lung capacity and reduces cortisol.
          </div>
          <Link href="/yoga" className="filter-insight-cta">
            Practice AI Pose Tracking &rarr;
          </Link>
        </div>
      )}
    </aside>
  );
}
