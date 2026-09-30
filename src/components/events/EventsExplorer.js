"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ACCESS_TAGS,
  AGE_GROUPS,
  CITIES,
  EVENTS,
  EVENT_TYPES,
  daysBetween,
  formatDate,
  formatPrice,
  isPast,
  lowestPrice,
  spotsLeft,
} from '../../data/fitnessEvents';
import { photo } from '../../data/fitnessPhotos';
import useToday from '../../lib/useToday';
import SampleDataBadge from '../shared/SampleDataBadge';
import styles from './Events.module.css';

const WHEN = [
  ['upcoming', 'ev.whenUpcoming'],
  ['week', 'ev.whenWeek'],
  ['month', 'ev.whenMonth'],
  ['quarter', 'ev.whenQuarter'],
  ['past', 'ev.whenPast'],
  ['all', 'ev.whenAll'],
];

const SORTS = [
  ['soonest', 'ev.sortSoonest'],
  ['latest', 'ev.sortLatest'],
  ['price-asc', 'ev.sortPriceAsc'],
  ['price-desc', 'ev.sortPriceDesc'],
  ['popular', 'ev.sortPopular'],
];

// Ids stay English (they match data values); labels resolve via i18n.
const LEVELS = [
  ['Beginner', 'ev.levelBeginner'],
  ['Intermediate', 'ev.levelIntermediate'],
  ['Advanced', 'ev.levelAdvanced'],
];

const initialFilters = {
  query: '',
  when: 'upcoming',
  price: 'all',
  types: [],
  ages: [],
  level: 'any',
  access: [],
  openOnly: false,
};

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function eventStatus(event, today) {
  if (!today) return null;
  if (isPast(event, today)) return { key: 'ev.stPast', tone: 'muted' };
  if (spotsLeft(event) === 0) return { key: 'ev.stSoldOut', tone: 'danger' };
  const closesIn = daysBetween(today, event.registrationCloses);
  if (closesIn < 0) return { key: 'ev.stClosed', tone: 'muted' };
  if (closesIn <= 7) return closesIn === 0 ? { key: 'ev.stToday', tone: 'warning' } : { key: 'ev.stClosesIn', tone: 'warning', days: closesIn };
  if (spotsLeft(event) / event.capacity < 0.15) return { key: 'ev.stFilling', tone: 'warning' };
  return null;
}

/** Resolve an eventStatus() result through i18n (handles the day count). */
export function statusText(status, t) {
  if (!status) return '';
  if (status.key === 'ev.stClosesIn') return t(status.key, { days: status.days });
  return t(status.key);
}

export default function EventsExplorer({ citySlug = null }) {
  const { t } = useTranslation();
  const router = useRouter();
  const today = useToday();
  const city = CITIES.find((c) => c.slug === citySlug) || null;

  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState('soonest');
  const [showFilters, setShowFilters] = useState(false);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const pool = useMemo(() => (city ? EVENTS.filter((e) => e.city === city.slug) : EVENTS), [city]);

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = pool.filter((e) => {
      if (q && !`${e.title} ${e.organiser} ${e.venue} ${e.address}`.toLowerCase().includes(q)) return false;
      // Until the browser's date is known, date filters are not applied.
      if (today && filters.when !== 'all') {
        const past = isPast(e, today);
        if (filters.when === 'past') {
          if (!past) return false;
        } else {
          if (past) return false;
          const horizon = { week: 7, month: 30, quarter: 92 }[filters.when];
          if (horizon && daysBetween(today, e.date) > horizon) return false;
        }
      }
      if (filters.price === 'free' && !e.price.free) return false;
      if (filters.price === 'paid' && e.price.free) return false;
      if (filters.types.length && !filters.types.includes(e.type)) return false;
      if (filters.ages.length && !filters.ages.some((a) => e.ageGroups.includes(a))) return false;
      if (filters.level !== 'any' && e.level !== filters.level) return false;
      if (filters.access.some((a) => !e.access.includes(a))) return false;
      if (filters.openOnly && spotsLeft(e) === 0) return false;
      return true;
    });

    const sorters = {
      soonest: (a, b) => a.date.localeCompare(b.date),
      latest: (a, b) => b.date.localeCompare(a.date),
      'price-asc': (a, b) => lowestPrice(a) - lowestPrice(b),
      'price-desc': (a, b) => lowestPrice(b) - lowestPrice(a),
      popular: (a, b) => b.registered - a.registered,
    };
    return [...list].sort(sorters[sort]);
  }, [pool, filters, sort, today]);

  const activeCount =
    (filters.query ? 1 : 0) +
    (filters.when !== 'upcoming' ? 1 : 0) +
    (filters.price !== 'all' ? 1 : 0) +
    filters.types.length +
    filters.ages.length +
    (filters.level !== 'any' ? 1 : 0) +
    filters.access.length +
    (filters.openOnly ? 1 : 0);

  const heading = city ? t('ev.headingIn', { city: city.name }) : t('ev.headingAll');

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/">{t('nav.home')}</Link>
        <span aria-hidden="true">/</span>
        {city ? <Link href="/events">{t('ev.metaTitle')}</Link> : <span>{t('ev.metaTitle')}</span>}
        {city && (
          <>
            <span aria-hidden="true">/</span>
            <span>{city.name}</span>
          </>
        )}
      </nav>

      <header className={styles.header}>
        <div>
          <h1 className={styles.h1}>{heading}</h1>
          <p className={styles.sub}>
            {t('ev.sub')}{' '}
            <SampleDataBadge label="Illustrative listings" />
          </p>
        </div>
        <label className={styles.cityPicker}>
          <i className="fa-solid fa-location-dot" aria-hidden="true" />
          <select
            value={city ? city.slug : ''}
            onChange={(e) => router.push(e.target.value ? `/events/${e.target.value}` : '/events')}
            aria-label={t('ev.chooseCity')}
          >
            <option value="">{t('ev.allCities')}</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className={styles.layout}>
        <aside className={`${styles.filters} ${showFilters ? styles.filtersOpen : ''}`} aria-label="Filters">
          <div className={styles.filterHead}>
            <strong>{t('ev.filters')}</strong>
            {activeCount > 0 && (
              <button className={styles.linkBtn} onClick={() => setFilters(initialFilters)}>
                {t('ev.resetCount', { n: activeCount })}
              </button>
            )}
          </div>

          <fieldset className={styles.fieldset}>
            <legend>{t('ev.when')}</legend>
            {WHEN.map(([id, label]) => (
              <label key={id} className={styles.radio}>
                <input type="radio" name="when" checked={filters.when === id} onChange={() => set({ when: id })} />
                {t(label)}
              </label>
            ))}
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>{t('ev.price')}</legend>
            <div className={styles.segment}>
              {[
                ['all', 'ev.priceAll'],
                ['free', 'ev.free'],
                ['paid', 'ev.paid'],
              ].map(([id, label]) => (
                <button key={id} aria-pressed={filters.price === id} className={filters.price === id ? styles.segOn : ''} onClick={() => set({ price: id })}>
                  {t(label)}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>{t('ev.type')}</legend>
            <div className={styles.chipWrap}>
              {Object.entries(EVENT_TYPES).map(([id, t]) => (
                <button
                  key={id}
                  className={`${styles.chip} ${filters.types.includes(id) ? styles.chipOn : ''}`}
                  aria-pressed={filters.types.includes(id)}
                  onClick={() => set({ types: toggle(filters.types, id) })}
                >
                  <i className={t.icon} aria-hidden="true" /> {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>{t('ev.age')}</legend>
            {Object.entries(AGE_GROUPS).map(([id, label]) => (
              <label key={id} className={styles.radio}>
                <input type="checkbox" checked={filters.ages.includes(id)} onChange={() => set({ ages: toggle(filters.ages, id) })} />
                {t(label)}
              </label>
            ))}
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>{t('ev.level')}</legend>
            <select className={styles.select} value={filters.level} onChange={(e) => set({ level: e.target.value })}>
              <option value="any">{t('ev.levelAny')}</option>
              {LEVELS.map(([id, key]) => (
                <option key={id} value={id}>{t(key)}</option>
              ))}
            </select>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend>{t('ev.access')}</legend>
            {Object.entries(ACCESS_TAGS).map(([id, tag]) => (
              <label key={id} className={styles.radio}>
                <input type="checkbox" checked={filters.access.includes(id)} onChange={() => set({ access: toggle(filters.access, id) })} />
                <i className={tag.icon} aria-hidden="true" /> {tag.label}
              </label>
            ))}
          </fieldset>

          <label className={`${styles.radio} ${styles.switchRow}`}>
            <input type="checkbox" checked={filters.openOnly} onChange={() => set({ openOnly: !filters.openOnly })} />
            {t('ev.hideSoldOut')}
          </label>

          <button className={`${styles.primaryBtn} ${styles.applyBtn}`} onClick={() => setShowFilters(false)}>
            {t('ev.showN', { n: results.length })}
          </button>
        </aside>

        <section className={styles.results}>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                placeholder={t('ev.searchPh')}
                value={filters.query}
                onChange={(e) => set({ query: e.target.value })}
              />
            </label>
            <button className={styles.filterToggle} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              <i className="fa-solid fa-filter" aria-hidden="true" /> {t('ev.filters')}{activeCount ? ` (${activeCount})` : ''}
            </button>
            <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('ev.sortLabel')}>
              {SORTS.map(([id, label]) => (
                <option key={id} value={id}>
                  {t(label)}
                </option>
              ))}
            </select>
          </div>

          <p className={styles.count} aria-live="polite">
            {t('ev.count', { count: results.length })}
          </p>

          {results.length === 0 ? (
            <div className={styles.empty}>
              <i className="fa-regular fa-calendar-xmark" aria-hidden="true" />
              <p>{city ? t('ev.emptyCity', { city: city.name }) : t('ev.emptyAll')}</p>
              <div className={styles.emptyActions}>
                <button className={styles.primaryBtn} onClick={() => setFilters(initialFilters)}>
                  {t('ev.resetFilters')}
                </button>
                {city && (
                  <Link className={styles.ghostBtn} href="/events">
                    {t('ev.seeAllCities')}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <ul className={styles.list}>
              {results.map((e) => (
                <EventCard key={e.id} event={e} today={today} showCity={!city} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function EventCard({ event, today, showCity }) {
  const { t } = useTranslation();
  const img = photo(event.photo);
  const type = EVENT_TYPES[event.type];
  const status = eventStatus(event, today);
  const cityName = CITIES.find((c) => c.slug === event.city)?.name;
  const [, month, day] = event.date.split('-');
  const monthLabel = formatDate(event.date, { month: 'short' });
  const fill = Math.min(100, Math.round((event.registered / event.capacity) * 100));
  const href = `/events/${event.city}/${event.id}`;

  return (
    <li className={styles.card}>
      <Link href={href} className={styles.cardImgWrap} tabIndex={-1} aria-hidden="true">
        <img src={img.src} alt="" loading="lazy" />
        <span className={styles.dateBlock}>
          <strong>{Number(day)}</strong>
          <small>{monthLabel || month}</small>
        </span>
      </Link>
      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <span className={styles.typeChip}>
            <i className={type.icon} aria-hidden="true" /> {type.label}
          </span>
          <span className={styles.level}>{event.level}</span>
          {status && <span className={`${styles.status} ${styles[status.tone]}`}>{statusText(status, t)}</span>}
        </div>
        <h2 className={styles.cardTitle}>
          <Link href={href}>{event.title}</Link>
        </h2>
        <p className={styles.meta}>
          <span><i className="fa-regular fa-calendar" aria-hidden="true" /> {formatDate(event.date)}{event.endDate ? ` – ${formatDate(event.endDate, { day: 'numeric', month: 'short' })}` : ''} · {event.time}</span>
          <span><i className="fa-solid fa-location-dot" aria-hidden="true" /> {event.venue}{showCity && cityName ? `, ${cityName}` : ''}</span>
        </p>
        <p className={styles.ages}>
          <i className="fa-solid fa-user-group" aria-hidden="true" /> {event.ageGroups.map((a) => AGE_GROUPS[a].split(' (')[0]).join(' · ')}
        </p>
        <div className={styles.cardFoot}>
          <span className={`${styles.price} ${event.price.free ? styles.freePrice : ''}`}>{formatPrice(event)}</span>
          <span className={styles.access}>
            {event.access.map((a) => (
              <i key={a} className={ACCESS_TAGS[a].icon} title={ACCESS_TAGS[a].label} aria-label={ACCESS_TAGS[a].label} />
            ))}
          </span>
          <span className={styles.capacity} title={`${event.registered.toLocaleString('en-IN')} of ${event.capacity.toLocaleString('en-IN')} registered`}>
            <span className={styles.bar}><span style={{ width: `${fill}%` }} /></span>
            {spotsLeft(event) > 0 ? t('ev.spotsLeft', { n: spotsLeft(event).toLocaleString('en-IN') }) : t('ev.full')}
          </span>
          <Link href={href} className={styles.detailsLink}>
            {t('ev.details')} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </li>
  );
}
