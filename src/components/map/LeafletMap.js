"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './pins.css';

// Leaflet reads `window` on import, so this file is only ever reached via a
// dynamic import with ssr: false (see MapPage).

const INDIA_CENTER = [22.5, 80.5];

function icon(item) {
  return L.divIcon({
    className: '',
    html: `<span class="ms-pin ms-pin--${item.pin}"><i class="${item.glyph}" aria-hidden="true"></i>${item.badge != null ? `<b>${item.badge}</b>` : ''}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    tooltipAnchor: [0, -18],
  });
}

// Fit to the pins only when the set of pins changes, so a minute tick or a
// re-render never undoes the user's panning.
function Fit({ items, center }) {
  const map = useMap();
  const key = items.map((i) => i.id).join('|');
  useEffect(() => {
    const pts = items.map((i) => [i.lat, i.lon]);
    if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 13 });
    else if (center) map.setView(center, 11);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/**
 * Generic map of labelled pins. items: [{ id, lat, lon, pin, glyph, title,
 * badge? }]. Pins are keyboard focusable with a descriptive title.
 */
export default function LeafletMap({ items, center, label, onSelect }) {
  return (
    <MapContainer center={center || INDIA_CENTER} zoom={center ? 11 : 4} className="ms-map" scrollWheelZoom={false} aria-label={label}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" />
      <Fit items={items} center={center} />
      {items.map((it) => (
        <Marker
          key={it.id}
          position={[it.lat, it.lon]}
          icon={icon(it)}
          title={it.title}
          alt={it.title}
          keyboard
          eventHandlers={{
            click: () => onSelect?.(it),
            keypress: (e) => {
              if (e.originalEvent.key === 'Enter') onSelect?.(it);
            },
          }}
        >
          <Tooltip direction="top">{it.title}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
