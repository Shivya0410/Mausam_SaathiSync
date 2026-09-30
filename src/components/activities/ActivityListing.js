"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ACTIVITIES, INCLUSIVE_TAGS } from '../../data/activities';
import { photo } from '../../data/fitnessPhotos';
import useStoredList from '../../lib/useStoredList';
import PhotoCredit from '../shared/PhotoCredit';
import styles from './ActivityListing.module.css';

const SAVED_KEY = 'swasth.savedVenues.v1';

function mapsLink(venue) {
  const query = venue.address || `${venue.name}, ${venue.area}, ${venue.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function isFree(venue) {
  return /free/i.test(venue.price || '');
}

export default function ActivityListing({ activity }) {
  const hero = photo(activity.photos[0]);
  const cities = useMemo(() => [...new Set(activity.venues.map((v) => v.city))], [activity]);
  const types = useMemo(() => [...new Set(activity.venues.map((v) => v.type))], [activity]);

  const [tab, setTab] = useState('places');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [type, setType] = useState('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const [needs, setNeeds] = useState([]);
  const [savedOnly, setSavedOnly] = useState(false);
  // Saved venues are a per-device convenience, shared across activity pages.
  const { list: saved, toggle: toggleSaved } = useStoredList(SAVED_KEY);

  const toggleNeed = (tag) =>
    setNeeds((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const venues = activity.venues.map((v) => ({ ...v, id: `${activity.slug}:${v.name}:${v.area}` }));

  const filtered = venues.filter((v) => {
    const q = query.trim().toLowerCase();
    if (q && !`${v.name} ${v.area} ${v.city} ${v.facilities.join(' ')}`.toLowerCase().includes(q)) return false;
    if (city !== 'all' && v.city !== city) return false;
    if (type !== 'all' && v.type !== type) return false;
    if (freeOnly && !isFree(v)) return false;
    if (needs.some((n) => !v.inclusive.includes(n))) return false;
    if (savedOnly && !saved.includes(v.id)) return false;
    return true;
  });

  const resetFilters = () => {
    setQuery('');
    setCity('all');
    setType('all');
    setFreeOnly(false);
    setNeeds([]);
    setSavedOnly(false);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <img src={hero.src} alt="" className={styles.heroImg} />
        <div className={styles.heroShade} />
        <div className={styles.heroBody}>
          <Link href="/" className={styles.back}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Home
          </Link>
          <h1 className={styles.title}>
            <i className={activity.icon} aria-hidden="true" /> {activity.title}
          </h1>
          <p className={styles.tagline}>{activity.tagline}</p>
          <div className={styles.facts}>
            <span><i className="fa-solid fa-bolt" aria-hidden="true" /> {activity.facts.intensity}</span>
            <span><i className="fa-solid fa-bag-shopping" aria-hidden="true" /> {activity.facts.kit}</span>
            <span><i className="fa-regular fa-clock" aria-hidden="true" /> {activity.facts.bestTime}</span>
          </div>
        </div>
        <PhotoCredit photo={hero} style={{ position: 'absolute', right: 12, bottom: 8, color: '#fff' }} />
      </section>

      <nav className={styles.switcher} aria-label="Other activities">
        {ACTIVITIES.map((a) => (
          <Link
            key={a.slug}
            href={`/activities/${a.slug}`}
            className={`${styles.switchChip} ${a.slug === activity.slug ? styles.switchActive : ''}`}
            aria-current={a.slug === activity.slug ? 'page' : undefined}
          >
            <i className={a.icon} aria-hidden="true" /> {a.title}
          </Link>
        ))}
        <Link href="/yoga" className={styles.switchChip}>
          <i className="fa-solid fa-om" aria-hidden="true" /> Yoga
        </Link>
      </nav>

      <div className={styles.tabs} role="tablist">
        {[
          ['places', `Places (${venues.length})`],
          ['learn', `Learn (${activity.resources.length})`],
          ['tips', 'Tips & adaptations'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'places' && (
        <section>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                placeholder={`Search ${activity.title.toLowerCase()} places, areas, facilities`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select className={styles.select} value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type of place">
              <option value="all">All types</option>
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className={styles.chips}>
            <button className={`${styles.chip} ${freeOnly ? styles.chipOn : ''}`} onClick={() => setFreeOnly((v) => !v)} aria-pressed={freeOnly}>
              <i className="fa-solid fa-indian-rupee-sign" aria-hidden="true" /> Free only
            </button>
            {Object.entries(INCLUSIVE_TAGS).map(([id, tag]) => (
              <button
                key={id}
                className={`${styles.chip} ${needs.includes(id) ? styles.chipOn : ''}`}
                onClick={() => toggleNeed(id)}
                aria-pressed={needs.includes(id)}
              >
                <i className={tag.icon} aria-hidden="true" /> {tag.label}
              </button>
            ))}
            <button className={`${styles.chip} ${savedOnly ? styles.chipOn : ''}`} onClick={() => setSavedOnly((v) => !v)} aria-pressed={savedOnly}>
              <i className="fa-solid fa-heart" aria-hidden="true" /> Saved ({saved.filter((id) => id.startsWith(`${activity.slug}:`)).length})
            </button>
          </div>

          <p className={styles.resultNote}>
            Showing {filtered.length} of {venues.length}. Timings and fees are indicative, so please confirm with the venue before you go.
          </p>

          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <i className="fa-solid fa-map-location-dot" aria-hidden="true" />
              <p>No places match these filters.</p>
              <button className={styles.primaryBtn} onClick={resetFilters}>Clear filters</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((v) => {
                const img = photo(v.photo);
                const isSaved = saved.includes(v.id);
                return (
                  <article key={v.id} className={styles.card}>
                    <div className={styles.cardImgWrap}>
                      <img src={img.src} alt="" className={styles.cardImg} loading="lazy" />
                      <span className={styles.typeBadge}>{v.type}</span>
                      {v.price && (
                        <span className={`${styles.priceBadge} ${isFree(v) ? styles.free : ''}`}>{v.price}</span>
                      )}
                      <button
                        className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
                        onClick={() => toggleSaved(v.id)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? `Remove ${v.name} from saved` : `Save ${v.name}`}
                      >
                        <i className={isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} aria-hidden="true" />
                      </button>
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{v.name}</h3>
                      <p className={styles.meta}>
                        <i className="fa-solid fa-location-dot" aria-hidden="true" /> {v.area}, {v.city}
                        {v.rating && (
                          <span className={styles.rating}>
                            <i className="fa-solid fa-star" aria-hidden="true" /> {v.rating.toFixed(1)}
                          </span>
                        )}
                      </p>
                      {v.timing && (
                        <p className={styles.meta}>
                          <i className="fa-regular fa-clock" aria-hidden="true" /> {v.timing}
                        </p>
                      )}
                      <div className={styles.facilities}>
                        {[...new Set(v.facilities)].map((f) => (
                          <span key={f}>{f}</span>
                        ))}
                      </div>
                      {v.inclusive.length > 0 && (
                        <div className={styles.inclusive}>
                          {v.inclusive.map((t) => (
                            <span key={t} title={INCLUSIVE_TAGS[t].label}>
                              <i className={INCLUSIVE_TAGS[t].icon} aria-hidden="true" />
                              <span className={styles.inclusiveLabel}>{INCLUSIVE_TAGS[t].label}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className={styles.actions}>
                        <a href={mapsLink(v)} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>
                          <i className="fa-solid fa-diamond-turn-right" aria-hidden="true" /> Directions
                        </a>
                        {v.phone && (
                          <a href={`tel:${v.phone.replace(/\s+/g, '')}`} className={styles.ghostBtn}>
                            <i className="fa-solid fa-phone" aria-hidden="true" /> Call
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'learn' && (
        <section className={styles.resources}>
          {activity.resources.map((r) => (
            <a key={r.title} href={r.link} target="_blank" rel="noopener noreferrer" className={styles.resource}>
              <span className={styles.play}><i className="fa-solid fa-play" aria-hidden="true" /></span>
              <span>
                <strong>{r.title}</strong>
                <small>{r.type} · {r.level} · {r.duration}</small>
              </span>
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
            </a>
          ))}
        </section>
      )}

      {tab === 'tips' && (
        <section className={styles.tipsWrap}>
          <div className={styles.tipsCard}>
            <h2>About {activity.title.toLowerCase()}</h2>
            <p>{activity.about}</p>
            <ul>
              {activity.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className={`${styles.tipsCard} ${styles.adaptCard}`}>
            <h2><i className="fa-solid fa-universal-access" aria-hidden="true" /> Make it work for you</h2>
            <p>{activity.adaptations}</p>
            <p className={styles.smallPrint}>
              If you have a health condition, are pregnant or are returning after an injury, check with a doctor or physiotherapist before starting.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
