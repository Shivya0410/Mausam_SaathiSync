"use client";

import { WIDGET_COMPONENTS } from '../widgets';
import { WIDGETS } from '../../config/widgets';
import { packRows } from '../../lib/mausam/gridPack';
import { stores, recordWidgetTap } from '../../lib/stores';
import { useStore } from '../../lib/hooks/useStore';

const SIZE = Object.fromEntries(WIDGETS.map((w) => [w.id, w.size]));

/**
 * Ranked widgets in a 12/8/1-column grid (PRD 5.9, 20.5). Packing reorders
 * the list itself, so DOM order equals visual order. Taps are counted on
 * the device for the gentle habit boost (PRD 5.11).
 */
export default function WidgetGrid({ ranked, view, env, limit }) {
  const [, setUsage] = useStore(stores.usage);
  const items = ranked
    .filter((r) => WIDGET_COMPONENTS[r.id])
    .slice(0, limit ?? ranked.length)
    .map((r) => ({ ...r, size: SIZE[r.id]?.desktop || 'full', mobileSize: SIZE[r.id]?.mobile || 'full' }));
  const packed = packRows(items);
  return (
    <div className="ms-grid">
      {packed.map((item) => {
        const Widget = WIDGET_COMPONENTS[item.id];
        return (
          <div
            key={item.id}
            className={`ms-grid-item ms-span--${item.size} ms-mspan--${item.mobileSize}`}
            data-widget={item.id}
            onClickCapture={() => setUsage((u) => recordWidgetTap(u, item.id))}
          >
            <Widget view={view} env={env} />
          </div>
        );
      })}
    </div>
  );
}
