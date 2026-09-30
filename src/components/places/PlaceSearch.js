"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Place search combobox (PRD 20.2, WAI-ARIA combobox pattern): debounced
 * 300 ms, at least 2 characters, India first. Arrow keys move through
 * results, Enter selects, Escape clears. Admin area and state are shown to
 * tell "Aurangabad, Maharashtra" from "Aurangabad, Bihar".
 */
export default function PlaceSearch({ onSelect, labelKey = 'places.search', autoFocus = false }) {
  const { t, i18n } = useTranslation();
  const uid = useId();
  const listId = `${uid}-list`;
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [state, setState] = useState('idle'); // idle | loading | done | error | hint
  const [active, setActive] = useState(-1);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    const query = q.trim();
    if (query.length < 2) return undefined;
    timer.current = setTimeout(async () => {
      setState('loading');
      try {
        const p = new URLSearchParams({ q: query, lang: i18n.language === 'hi' ? 'hi' : 'en' });
        const r = await fetch(`/api/mausam/places/search?${p}`);
        const body = await r.json();
        if (!r.ok) throw new Error();
        setResults(body.results || []);
        setActive(-1);
        setState(body.hint ? 'hint' : 'done');
      } catch {
        setResults([]);
        setState('error');
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q, i18n.language]);

  const choose = (r) => {
    onSelect(r);
    setQ('');
    setResults([]);
    setState('idle');
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && active >= 0 && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setQ('');
      setResults([]);
      setState('idle');
    }
  };

  const open = results.length > 0 && q.trim().length >= 2;
  return (
    <div className="ms-combo">
      <label htmlFor={`${uid}-input`} className="ms-label">
        {t(labelKey)}
      </label>
      <div className="ms-combo-field">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input
          id={`${uid}-input`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${uid}-opt-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (e.target.value.trim().length < 2) {
              setResults([]);
              setState('idle');
            }
          }}
          onKeyDown={onKey}
          placeholder={t('places.searchPlaceholder')}
        />
      </div>
      <p className="ms-combo-status" role="status">
        {state === 'loading' ? t('places.searching') : null}
        {state === 'hint' ? t('places.pinHint') : null}
        {state === 'error' ? t('places.searchError') : null}
        {state === 'done' && !results.length ? t('places.noResults') : null}
        {state === 'done' && results.length ? t('places.resultCount', { count: results.length }) : null}
      </p>
      <ul id={listId} role="listbox" className="ms-combo-list" hidden={!open} aria-label={t(labelKey)}>
        {results.map((r, i) => (
          <li
            key={r.id}
            id={`${uid}-opt-${i}`}
            role="option"
            aria-selected={i === active}
            className={i === active ? 'is-active' : ''}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(r)}
          >
            <strong>{r.name}</strong>
            <span className="ms-muted">{[r.admin2, r.admin1, r.countryCode !== 'IN' ? r.country : null].filter(Boolean).join(', ')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
