"use client";

import { useId, useRef } from 'react';

/**
 * Accessible tabs (WAI-ARIA tabs pattern): roving tabindex, Left/Right/Home/
 * End move and activate. `tabs` is [{ id, label }]; the panel is rendered by
 * the caller via `children(activeId)`.
 */
export default function Tabs({ tabs, active, onChange, label, children }) {
  const uid = useId();
  const refs = useRef({});
  const onKey = (e) => {
    const i = tabs.findIndex((x) => x.id === active);
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabs.length - 1;
    if (j == null) return;
    e.preventDefault();
    onChange(tabs[j].id);
    refs.current[tabs[j].id]?.focus();
  };
  return (
    <>
      <div className="ms-tabs" role="tablist" aria-label={label} onKeyDown={onKey}>
        {tabs.map((x) => (
          <button
            key={x.id}
            ref={(el) => {
              refs.current[x.id] = el;
            }}
            type="button"
            role="tab"
            id={`${uid}-tab-${x.id}`}
            aria-selected={active === x.id}
            aria-controls={`${uid}-panel`}
            tabIndex={active === x.id ? 0 : -1}
            className="ms-tab-btn"
            onClick={() => onChange(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} tabIndex={0} className="ms-tabpanel">
        {children(active)}
      </div>
    </>
  );
}
