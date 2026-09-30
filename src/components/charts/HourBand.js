"use client";

import { useRef, useState } from 'react';

/**
 * A row of hour cells coloured by band (PRD 20.6): run score, heat danger,
 * outdoor comfort. Keyboard: the band is a listbox; Left/Right move,
 * Home/End jump. Unsafe cells are hatched as well as coloured, and every
 * cell carries a text label, so colour is never the only signal.
 *
 * cells: [{ key, hourLabel, band: 'excellent'|'good'|'fair'|'poor'|'unsafe', label }]
 */
export default function HourBand({ cells, ariaLabel, highlight = [], showEvery = 3 }) {
  const [active, setActive] = useState(() => Math.max(0, cells.findIndex((c) => highlight.includes(c.key))));
  const refs = useRef([]);
  const move = (i) => {
    const j = Math.max(0, Math.min(cells.length - 1, i));
    setActive(j);
    refs.current[j]?.focus();
  };
  const onKey = (e) => {
    const map = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: cells.length - 1 };
    if (e.key in map) {
      e.preventDefault();
      move(map[e.key]);
    }
  };
  if (!cells.length) return null;
  return (
    <div className="ms-hourband-wrap">
      <div className="ms-hourband" role="listbox" aria-label={ariaLabel} onKeyDown={onKey}>
        {cells.map((c, i) => (
          <div
            key={c.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="option"
            aria-selected={i === active}
            aria-label={c.label}
            tabIndex={i === active ? 0 : -1}
            className={`ms-hourcell ms-band--${c.band} ${highlight.includes(c.key) ? 'is-highlight' : ''}`}
            onClick={() => move(i)}
            onFocus={() => setActive(i)}
          >
            <span className="ms-hourcell-label" aria-hidden="true">
              {i % showEvery === 0 ? c.hourLabel : ''}
            </span>
          </div>
        ))}
      </div>
      <p className="ms-hourband-detail" aria-live="polite">
        {cells[active]?.label}
      </p>
    </div>
  );
}
