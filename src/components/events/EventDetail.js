"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  ACCESS_TAGS,
  AGE_GROUPS,
  EVENT_TYPES,
  daysBetween,
  eventsForCity,
  formatDate,
  getCity,
  isPast,
  spotsLeft,
} from '../../data/fitnessEvents';
import { photo } from '../../data/fitnessPhotos';
import useStoredList from '../../lib/useStoredList';
import useToday from '../../lib/useToday';
import PhotoCredit from '../shared/PhotoCredit';
import SampleDataBadge from '../shared/SampleDataBadge';
import { eventStatus, statusText } from './EventsExplorer';
import styles from './Events.module.css';

const SAVED_KEY = 'swasth.savedEvents.v1';

function icsFor(event, city) {
  const stamp = (iso, time) => `${iso.replace(/-/g, '')}T${(time || '00:00').replace(':', '')}00`;
  const end = event.endDate || event.date;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Swasth Infinity//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@swasth`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;TZID=Asia/Kolkata:${stamp(event.date, event.time)}`,
    `DTEND;TZID=Asia/Kolkata:${stamp(end, event.time.replace(/^(\d\d)/, (h) => String(Math.min(23, Number(h) + 3)).padStart(2, '0')))}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.venue}, ${event.address}`,
    `DESCRIPTION:${event.description.replace(/\n/g, ' ')} (Organiser: ${event.organiser}. ${city?.name || ''})`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export default function EventDetail({ event }) {
  const { t } = useTranslation();
  const today = useToday();
  const city = getCity(event.city);
  const type = EVENT_TYPES[event.type];
  const hero = photo(event.photo);
  const status = eventStatus(event, today);
  const left = spotsLeft(event);
  const fill = Math.min(100, Math.round((event.registered / event.capacity) * 100));
  const closesIn = today ? daysBetween(today, event.registrationCloses) : null;
  const canRegister = today && !isPast(event, today) && left > 0 && closesIn >= 0;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.address}`)}`;

  const savedEvents = useStoredList(SAVED_KEY);
  const saved = savedEvents.has(event.id);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleSave = () => {
    const nowSaved = savedEvents.toggle(event.id);
    setToast(nowSaved ? t('ev.toastSaved') : t('ev.toastRemoved'));
  };

  const addToCalendar = () => {
    const blob = new Blob([icsFor(event, city)], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setToast(t('ev.toastCal'));
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: `${event.title} on ${formatDate(event.date)}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast('Link copied');
      }
    } catch {
      // The user dismissed the share sheet.
    }
  };

  const more = eventsForCity(event.city)
    .filter((e) => e.id !== event.id && (!today || !isPast(e, today)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className={styles.page}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link href="/">{t('nav.home')}</Link>
        <span aria-hidden="true">/</span>
        <Link href="/events">{t('ev.metaTitle')}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/events/${event.city}`}>{city?.name}</Link>
      </nav>

      <section className={styles.detailHero}>
        <img src={hero.src} alt="" />
        <div className={styles.detailShade} />
        <div className={styles.detailHeroBody}>
          <div className={styles.cardTop}>
            <span className={styles.typeChipLight}><i className={type.icon} aria-hidden="true" /> {type.label}</span>
            <span className={styles.typeChipLight}>{event.level}</span>
            {status && <span className={`${styles.status} ${styles[status.tone]}`}>{statusText(status, t)}</span>}
          </div>
          <h1 className={styles.detailTitle}>{event.title}</h1>
          <p className={styles.detailSub}>
            {t('ev.by')} {event.organiser} · {formatDate(event.date)}{event.endDate ? ` – ${formatDate(event.endDate)}` : ''} · {city?.name}
          </p>
        </div>
        <PhotoCredit photo={hero} style={{ position: 'absolute', right: 12, bottom: 8, color: '#fff' }} />
      </section>

      <div className={styles.detailLayout}>
        <article className={styles.detailMain}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <i className="fa-regular fa-calendar" aria-hidden="true" />
              <div>
                <small>{t('ev.dateTime')}</small>
                <strong>{formatDate(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                <span>{event.endDate ? t('ev.until', { date: formatDate(event.endDate) }) + ' · ' : ''}{t('ev.startsAt', { time: event.time })}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              <div>
                <small>{t('ev.venue')}</small>
                <strong>{event.venue}</strong>
                <span>{event.address}</span>
                <a href={mapLink} target="_blank" rel="noopener noreferrer">{t('ev.openMaps')}</a>
              </div>
            </div>
            <div className={styles.infoItem}>
              <i className="fa-solid fa-user-group" aria-hidden="true" />
              <div>
                <small>{t('ev.ageGroups')}</small>
                <strong>{event.ageGroups.map((a) => AGE_GROUPS[a]).join(', ')}</strong>
              </div>
            </div>
            <div className={styles.infoItem}>
              <i className="fa-regular fa-hourglass-half" aria-hidden="true" />
              <div>
                <small>{t('ev.regCloses')}</small>
                <strong>{formatDate(event.registrationCloses)}</strong>
                {closesIn !== null && closesIn >= 0 && <span>{closesIn === 0 ? t('ev.today') : t('ev.inDays', { n: closesIn })}</span>}
              </div>
            </div>
          </div>

          <section className={styles.block}>
            <h2>{t('ev.about')}</h2>
            <p>{event.description}</p>
          </section>

          <section className={styles.block}>
            <h2>{t('ev.formats')}</h2>
            <div className={styles.chipWrap}>
              {event.formats.map((f) => (
                <span key={f} className={styles.formatChip}>{f}</span>
              ))}
            </div>
          </section>

          <section className={styles.block}>
            <h2>{t('ev.access')}</h2>
            {event.access.length ? (
              <ul className={styles.accessList}>
                {event.access.map((a) => (
                  <li key={a}><i className={ACCESS_TAGS[a].icon} aria-hidden="true" /> {ACCESS_TAGS[a].label}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>{t('ev.noAccess')}</p>
            )}
          </section>

          <div className={styles.twoCol}>
            <section className={styles.block}>
              <h2>{t('ev.highlights')}</h2>
              <ul className={styles.tickList}>
                {event.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </section>
            <section className={styles.block}>
              <h2>{t('ev.included')}</h2>
              <ul className={styles.tickList}>
                {event.includes.map((h) => <li key={h}>{h}</li>)}
              </ul>
              <h2 className={styles.mt}>{t('ev.bring')}</h2>
              <ul className={styles.tickList}>
                {event.bring.map((h) => <li key={h}>{h}</li>)}
              </ul>
            </section>
          </div>

          <p className={styles.muted}>
            <SampleDataBadge label="Illustrative listing" /> {t('ev.sampleNote')}
          </p>
        </article>

        <aside className={styles.ticketCard}>
          <h2>{t('ev.tickets')}</h2>
          <ul className={styles.tiers}>
            {event.price.tiers.map((tier) => (
              <li key={tier.label}>
                <span>{tier.label}</span>
                <strong>{tier.amount === 0 ? t('ev.free') : `₹${tier.amount.toLocaleString('en-IN')}`}</strong>
              </li>
            ))}
          </ul>
          <div className={styles.capacityBig}>
            <span className={styles.bar}><span style={{ width: `${fill}%` }} /></span>
            <small>
              {left > 0 ? t('ev.regStats', { reg: event.registered.toLocaleString('en-IN'), left: left.toLocaleString('en-IN') }) : t('ev.regFull', { reg: event.registered.toLocaleString('en-IN') })}
            </small>
          </div>

          {event.website ? (
            <a
              href={event.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.primaryBtn} ${styles.block100} ${canRegister ? '' : styles.disabled}`}
              aria-disabled={!canRegister}
            >
              {t('ev.registerSite')} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
            </a>
          ) : (
            <button className={`${styles.primaryBtn} ${styles.block100}`} onClick={toggleSave} disabled={!canRegister && !saved}>
              {saved ? <><i className="fa-solid fa-check" aria-hidden="true" /> {t('ev.interested')}</> : t('ev.interestedCta')}
            </button>
          )}

          <div className={styles.actionRow}>
            <button className={styles.ghostBtn} onClick={toggleSave} aria-pressed={saved}>
              <i className={saved ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'} aria-hidden="true" /> {saved ? t('ev.saved') : t('ev.saveBtn')}
            </button>
            <button className={styles.ghostBtn} onClick={addToCalendar}>
              <i className="fa-regular fa-calendar-plus" aria-hidden="true" /> {t('ev.calendarBtn')}
            </button>
            <button className={styles.ghostBtn} onClick={share}>
              <i className="fa-solid fa-share-nodes" aria-hidden="true" /> {t('ev.shareBtn')}
            </button>
          </div>
          <p className={styles.organiser}>
            <i className="fa-solid fa-building-flag" aria-hidden="true" /> {t('ev.organisedBy')} <strong>{event.organiser}</strong>
          </p>
        </aside>
      </div>

      {more.length > 0 && (
        <section className={styles.more}>
          <h2>{t('ev.moreIn', { city: city?.name })}</h2>
          <div className={styles.moreGrid}>
            {more.map((e) => (
              <Link key={e.id} href={`/events/${e.city}/${e.id}`} className={styles.moreCard}>
                <img src={photo(e.photo).src} alt="" loading="lazy" />
                <span>
                  <small>{formatDate(e.date)}</small>
                  <strong>{e.title}</strong>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}
