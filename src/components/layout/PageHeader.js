"use client";

import "./PageHeader.css";

/**
 * The one shared page header (PRD 4.4). Every page renders this so headers
 * never drift apart: one h1 title, a one-line subtitle, an optional chip.
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
