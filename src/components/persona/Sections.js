"use client";

import { useTranslation } from 'react-i18next';

/** A titled list of tips from an i18n array (`key` resolves to string[]). */
export function Tips({ id, titleKey, listKey, icon = 'fa-solid fa-circle-check', footerKey }) {
  const { t } = useTranslation();
  const items = t(listKey, { returnObjects: true });
  return (
    <section className="ms-card" aria-labelledby={id}>
      <h2 id={id}>{t(titleKey)}</h2>
      <ul className="ms-tips">
        {(Array.isArray(items) ? items : []).map((x) => (
          <li key={x}>
            <i className={icon} aria-hidden="true"></i> {x}
          </li>
        ))}
      </ul>
      {footerKey ? <p className="ms-muted">{t(footerKey)}</p> : null}
    </section>
  );
}

/**
 * First-aid steps as a native disclosure (keyboard and screen reader
 * friendly), numbered, with a call button (PRD 16.4 rule 8).
 */
export function FirstAid({ titleKey, stepsKey, signsKey, call = '108', open = false }) {
  const { t } = useTranslation();
  const steps = t(stepsKey, { returnObjects: true });
  const signs = signsKey ? t(signsKey, { returnObjects: true }) : null;
  return (
    <details className="ms-card ms-firstaid" open={open}>
      <summary>
        <i className="fa-solid fa-kit-medical" aria-hidden="true"></i> {t(titleKey)}
      </summary>
      {Array.isArray(signs) ? (
        <>
          <p><strong>{t('firstAid.signs')}</strong></p>
          <ul className="ms-list">{signs.map((s) => <li key={s}>{s}</li>)}</ul>
        </>
      ) : null}
      <p><strong>{t('firstAid.whatToDo')}</strong></p>
      <ol className="ms-steps">{(Array.isArray(steps) ? steps : []).map((s) => <li key={s}>{s}</li>)}</ol>
      <a href={`tel:${call}`} className="ms-btn ms-btn--danger">
        <i className="fa-solid fa-phone" aria-hidden="true"></i> {t('firstAid.call', { number: call })}
      </a>
    </details>
  );
}

/** Pressed-state chip group (activity, duration, slot pickers). */
export function ChipGroup({ label, options, value, onChange }) {
  return (
    <div className="ms-chipgroup" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="ms-chip-btn" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
