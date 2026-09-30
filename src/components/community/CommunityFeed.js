"use client";

import { useState } from 'react';
import Link from 'next/link';
import { AUTHORS, POSTS, TOPICS, latestPosts, readMinutes, relativeDate } from '../../data/communityFeed';
import { DEVICES } from '../../data/devices';
import { photo } from '../../data/fitnessPhotos';
import useStoredList from '../../lib/useStoredList';
import useToday from '../../lib/useToday';
import Avatar from '../shared/Avatar';
import DeviceChip from '../shared/DeviceChip';
import SampleDataBadge from '../shared/SampleDataBadge';
import styles from './Community.module.css';

export const CLAPS_KEY = 'swasth.clappedPosts.v1';
export const BOOKMARKS_KEY = 'swasth.bookmarkedPosts.v1';
export const FOLLOWS_KEY = 'swasth.followedAuthors.v1';

const usedDevices = [...new Set(POSTS.flatMap((p) => p.devices))];

export default function CommunityFeed() {
  const today = useToday();
  const claps = useStoredList(CLAPS_KEY);
  const bookmarks = useStoredList(BOOKMARKS_KEY);
  const follows = useStoredList(FOLLOWS_KEY);

  const [tab, setTab] = useState('for-you');
  const [deviceFilter, setDeviceFilter] = useState(null);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const posts = latestPosts().filter((p) => {
    if (tab === 'following' && !follows.has(p.author)) return false;
    if (tab === 'saved' && !bookmarks.has(p.slug)) return false;
    if (TOPICS.includes(tab) && p.topic !== tab) return false;
    if (deviceFilter && !p.devices.includes(deviceFilter)) return false;
    if (q && !`${p.title} ${p.subtitle} ${AUTHORS[p.author].name} ${p.topic}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const staffPicks = [...POSTS].sort((a, b) => b.claps - a.claps).slice(0, 3);
  const whoToFollow = Object.entries(AUTHORS)
    .sort((a, b) => b[1].followers - a[1].followers)
    .slice(0, 4);

  const tabs = [
    ['for-you', 'For you'],
    ['following', `Following${follows.list.length ? ` (${follows.list.length})` : ''}`],
    ['saved', `Saved${bookmarks.list.length ? ` (${bookmarks.list.length})` : ''}`],
    ...TOPICS.map((t) => [t, t]),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.feedHeader}>
        <div>
          <h1 className={styles.feedTitle}>Community</h1>
          <p className={styles.feedSub}>
            Real workouts, honest lessons, and the watches, bands and apps people use to track them.{' '}
            <SampleDataBadge label="Sample community posts" />
          </p>
        </div>
        <label className={styles.search}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input type="search" placeholder="Search stories" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </header>

      <div className={styles.layout}>
        <main className={styles.main}>
          <nav className={styles.topicBar} aria-label="Feed">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                className={`${styles.topicTab} ${tab === id ? styles.topicActive : ''}`}
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {deviceFilter && (
            <p className={styles.filterNote}>
              Showing stories tracked with <DeviceChip id={deviceFilter} />
              <button className={styles.linkBtn} onClick={() => setDeviceFilter(null)}>Clear</button>
            </p>
          )}

          {posts.length === 0 ? (
            <div className={styles.empty}>
              {tab === 'following' ? (
                <p>You are not following anyone yet. Follow a few people from the list on the right.</p>
              ) : tab === 'saved' ? (
                <p>Bookmark stories to read later and they will appear here.</p>
              ) : (
                <p>No stories match. Try another topic or clear the device filter.</p>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <PostRow
                key={post.slug}
                post={post}
                today={today}
                clapped={claps.has(post.slug)}
                bookmarked={bookmarks.has(post.slug)}
                onClap={() => claps.toggle(post.slug)}
                onBookmark={() => bookmarks.toggle(post.slug)}
                onDevice={setDeviceFilter}
              />
            ))
          )}
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.sideBlock}>
            <h2>Staff picks</h2>
            {staffPicks.map((p) => (
              <Link key={p.slug} href={`/blogs/${p.slug}`} className={styles.pick}>
                <span className={styles.byline}>
                  <Avatar seed={p.author} look={AUTHORS[p.author].look} size={20} title={AUTHORS[p.author].name} /> {AUTHORS[p.author].name}
                </span>
                <strong>{p.title}</strong>
              </Link>
            ))}
          </section>

          <section className={styles.sideBlock}>
            <h2>Tracked with</h2>
            <div className={styles.deviceGrid}>
              {usedDevices.map((id) => (
                <button
                  key={id}
                  className={`${styles.deviceBtn} ${deviceFilter === id ? styles.deviceOn : ''}`}
                  aria-pressed={deviceFilter === id}
                  onClick={() => setDeviceFilter(deviceFilter === id ? null : id)}
                >
                  <i className={DEVICES[id].icon} style={{ color: DEVICES[id].color }} aria-hidden="true" />
                  {DEVICES[id].label}
                  <small>{POSTS.filter((p) => p.devices.includes(id)).length}</small>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.sideBlock}>
            <h2>Recommended topics</h2>
            <div className={styles.topicChips}>
              {TOPICS.map((t) => (
                <button key={t} className={styles.topicChip} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
          </section>

          <section className={styles.sideBlock}>
            <h2>Who to follow</h2>
            {whoToFollow.map(([id, a]) => (
              <div key={id} className={styles.follow}>
                <Avatar seed={id} look={a.look} size={40} title={a.name} />
                <span>
                  <strong>{a.name}</strong>
                  <small>{a.bio}</small>
                </span>
                <button
                  className={follows.has(id) ? styles.followingBtn : styles.followBtn}
                  onClick={() => follows.toggle(id)}
                  aria-pressed={follows.has(id)}
                >
                  {follows.has(id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

function PostRow({ post, today, clapped, bookmarked, onClap, onBookmark, onDevice }) {
  const author = AUTHORS[post.author];
  const cover = photo(post.cover);
  const href = `/blogs/${post.slug}`;
  const headline = post.activity.stats.slice(0, 2).map(([, v]) => v).join(' · ');

  return (
    <article className={styles.row}>
      <div className={styles.byline}>
        <Avatar seed={post.author} look={AUTHORS[post.author].look} size={24} title={author.name} />
        <span><strong>{author.name}</strong> in {author.city}</span>
      </div>

      <div className={styles.rowGrid}>
        <div>
          <h2 className={styles.rowTitle}><Link href={href}>{post.title}</Link></h2>
          <p className={styles.rowSub}>{post.subtitle}</p>
        </div>
        <Link href={href} className={styles.thumb} tabIndex={-1} aria-hidden="true">
          <img src={cover.src} alt="" loading="lazy" />
        </Link>
      </div>

      <div className={styles.activityStrip}>
        <i className="fa-solid fa-chart-line" aria-hidden="true" />
        <span className={styles.activityText}>
          <strong>{post.activity.label}</strong> · {headline}
        </span>
        <span className={styles.stripDevices}>
          {post.devices.map((d) => (
            <button key={d} className={styles.deviceMini} onClick={() => onDevice(d)} title={`More stories tracked with ${DEVICES[d]?.label || d}`}>
              <DeviceChip id={d} />
            </button>
          ))}
        </span>
      </div>

      <div className={styles.rowFoot}>
        <span className={styles.topicPill}>{post.topic}</span>
        <span>{relativeDate(post.publishedAt, today)}</span>
        <span>{readMinutes(post)} min read</span>
        <button className={`${styles.iconBtn} ${clapped ? styles.clapped : ''}`} onClick={onClap} aria-pressed={clapped} aria-label="Clap">
          <i className="fa-solid fa-hands-clapping" aria-hidden="true" /> {(post.claps + (clapped ? 1 : 0)).toLocaleString('en-IN')}
        </button>
        <Link href={`${href}#responses`} className={styles.iconBtn} aria-label="Responses">
          <i className="fa-regular fa-comment" aria-hidden="true" /> {post.responses.length}
        </Link>
        <button className={`${styles.iconBtn} ${styles.push}`} onClick={onBookmark} aria-pressed={bookmarked} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
          <i className={bookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
