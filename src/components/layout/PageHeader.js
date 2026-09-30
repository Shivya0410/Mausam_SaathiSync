"use client";

import "./PageHeader.css";

/**
 * The one shared page header. Every main page (Fitness, Wellness, Dietary,
 * Tracker, Community, SheFit) renders this so headers can never drift apart
 * again: slim gradient bar, serif title, one-line subtitle, optional chip.
 */
export default function PageHeader({ title, subtitle, chipIcon, chipText }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {chipText ? (
        <span className="ph-chip">
          {chipIcon ? <i className={chipIcon} aria-hidden="true"></i> : null} {chipText}
        </span>
      ) : null}
    </div>
  );
}
