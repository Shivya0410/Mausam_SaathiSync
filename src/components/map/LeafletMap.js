"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { INDIA_CENTER, INDIA_ZOOM } from './fitnessEvents';
import './pins.css';

// Leaflet reads `window` as soon as it is imported, so nothing in this file may
// be pulled into a server render. It is only ever reached through the
// ssr: false dynamic import in FitnessEventsMap.

// A drawn pin carrying the number of upcoming events, instead of the stock
// marker image that used to be hotlinked from a CDN.
function pinIcon(count, active) {
  return L.divIcon({
    className: '',
    html: `<span class="swasth-pin${active ? ' swasth-pin--active' : ''}"><span>${count}</span></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    tooltipAnchor: [0, -38],
  });
}

const LeafletMap = ({ cities, activeSlug, onHover, onSelect, style }) => (
  <MapContainer center={INDIA_CENTER} zoom={INDIA_ZOOM} style={style} scrollWheelZoom={false}>
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
    />

    {cities.map((city) => (
      <Marker
        key={city.slug}
        position={city.coordinates}
        icon={pinIcon(city.upcoming.length, city.slug === activeSlug)}
        title={`${city.name}: ${city.upcoming.length} upcoming events`}
        keyboard
        eventHandlers={{
          click: () => onSelect(city),
          keypress: (e) => {
            if (e.originalEvent.key === 'Enter') onSelect(city);
          },
          mouseover: () => onHover(city.slug),
          mouseout: () => onHover(null),
        }}
      >
        <Tooltip direction="top">
          <strong>{city.name}</strong>
          <br />
          {city.upcoming.length} upcoming · next: {city.next.title}
          <br />
          <em>Click to see all events</em>
        </Tooltip>
      </Marker>
    ))}
  </MapContainer>
);

export default LeafletMap;
