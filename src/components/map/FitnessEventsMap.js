"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EVENT_TYPES, formatDate, formatPrice } from '../../data/fitnessEvents';
import useToday from '../../lib/useToday';
import { citySummaries } from './fitnessEvents';

// ssr: false keeps Leaflet out of the server render entirely. Marking the file
// "use client" is not enough on its own: client components are still
// prerendered on the server, and Leaflet touches `window` at import time.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => <div style={{ width: '70%', height: '100%', background: '#eef0f6' }} />,
});

const panel = {
  width: '30%',
  padding: '10px 12px',
  overflowY: 'auto',
  borderLeft: '1px solid #ddd',
  fontSize: '0.85rem',
};

// Clicking a pin (or a city in the side list) opens that city's event listing
// at /events/[city]. Hovering a pin highlights the city in the list so the two
// read as one control.
const FitnessEventsMap = ({ placeholder, mapStyle = { width: '70%', height: '100%' } }) => {
  const router = useRouter();
  const today = useToday();
  const [hovered, setHovered] = useState(null);
  const cities = today ? citySummaries(today) : [];
  const totalUpcoming = cities.reduce((n, c) => n + c.upcoming.length, 0);

  const open = (city) => router.push(`/events/${city.slug}`);

  return (
    <>
      <LeafletMap cities={cities} activeSlug={hovered} onHover={setHovered} onSelect={open} style={mapStyle} />

      <div style={panel}>
        <p style={{ margin: '0 0 8px', color: '#5c5470' }}>
          {placeholder} <strong>{totalUpcoming}</strong> upcoming in {cities.length} cities.
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
          {cities.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/events/${city.slug}`}
                onMouseEnter={() => setHovered(city.slug)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'block',
                  padding: '7px 9px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  color: 'inherit',
                  background: hovered === city.slug ? '#efe4fb' : '#fff',
                  border: '1px solid #ebe5f5',
                }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  <strong style={{ color: '#493971' }}>{city.name}</strong>
                  <span style={{ background: '#6a1b9a', color: '#fff', borderRadius: 999, padding: '0 7px', fontWeight: 700 }}>
                    {city.upcoming.length}
                  </span>
                </span>
                <span style={{ display: 'block', color: '#5c5470', marginTop: 2 }}>
                  <i className={EVENT_TYPES[city.next.type].icon} aria-hidden="true" /> {city.next.title}
                </span>
                <span style={{ display: 'block', color: '#5c5470', fontSize: '0.75rem' }}>
                  {formatDate(city.next.date, { day: 'numeric', month: 'short' })} · {formatPrice(city.next)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/events" style={{ display: 'inline-block', marginTop: 10, fontWeight: 700, color: '#6a1b9a' }}>
          Browse all events →
        </Link>
      </div>
    </>
  );
};

export default FitnessEventsMap;
