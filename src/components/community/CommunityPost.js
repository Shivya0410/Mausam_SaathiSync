"use client";

import { useState } from 'react';
import Link from 'next/link';
import { AUTHORS, POSTS, readMinutes, relativeDate } from '../../data/communityFeed';
import { photo } from '../../data/fitnessPhotos';
import useStoredList from '../../lib/useStoredList';
import useToday from '../../lib/useToday';
import Avatar from '../shared/Avatar';
import DeviceChip from '../shared/DeviceChip';
import PhotoCredit from '../shared/PhotoCredit';
import SampleDataBadge from '../shared/SampleDataBadge';
import { BOOKMARKS_KEY, CLAPS_KEY, FOLLOWS_KEY } from './CommunityFeed';
import styles from './Community.module.css';

const ZONE_COLORS = ['#94a3b8', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];

export default function CommunityPost({ post }) {
  const today = useToday();
  const author = AUTHORS[post.author];
  const cover = photo(post.cover);

  const claps = useStoredList(CLAPS_KEY);
  const bookmarks = useStoredList(BOOKMARKS_KEY);
  const follows = useStoredList(FOLLOWS_KEY);
  const myResponses = useStoredList(`swasth.responses.${post.slug}`);

  const clapped = claps.has(post.slug);
  const bookmarked = bookmarks.has(post.slug);
  const following = follows.has(post.author);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Share sheet dismissed.
    }
  };

  const respond = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    myResponses.write([...myResponses.list, { id: `${Date.now()}`, text, at: new Date().toISOString() }]);
    setDraft('');
  };

  const more = POSTS.filter((p) => p.slug !== post.slug)
    .sort((a, b) => (a.author === post.author ? -1 : 0) - (b.author === post.author ? -1 : 0) || b.claps - a.claps)
    .slice(0, 3);

  const actionBar = (
    <div className={styles.actionBar}>
      <button className={`${styles.iconBtn} ${clapped ? styles.clapped : ''}`} onClick={() => claps.toggle(post.slug)} aria-pressed={clapped}>
        <i className="fa-solid fa-hands-clapping" aria-hidden="true" /> {(post.claps + (clapped ? 1 : 0)).toLocaleString('en-IN')}
      </button>
      <a href="#responses" className={styles.iconBtn}>
        <i className="fa-regular fa-comment" aria-hidden="true" /> {post.responses.length + myResponses.list.length}
      </a>
      <span className={styles.push} />
      <button className={styles.iconBtn} onClick={() => bookmarks.toggle(post.slug)} aria-pressed={bookmarked} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
        <i className={bookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'} aria-hidden="true" />
      </button>
      <button className={styles.iconBtn} onClick={share} aria-label="Share">
        <i className="fa-solid fa-share-nodes" aria-hidden="true" /> {copied ? 'Link copied' : ''}
      </button>
    </div>
  );

  return (
    <div className={styles.page}>
      <article className={styles.article}>
        <Link href="/blogs" className={styles.backLink}>
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Community
        </Link>

        <h1 className={styles.articleTitle}>{post.title}</h1>
        <p className={styles.articleSub}>{post.subtitle}</p>

        <div className={styles.authorRow}>
          <Avatar seed={post.author} look={AUTHORS[post.author].look} size={44} title={author.name} />
          <div>
            <p className={styles.authorLine}>
              <strong>{author.name}</strong> ·{' '}
              <button className={styles.linkBtn} onClick={() => follows.toggle(post.author)} aria-pressed={following}>
                {following ? 'Following' : 'Follow'}
              </button>
            </p>
            <p className={styles.metaLine}>
              {readMinutes(post)} min read · {relativeDate(post.publishedAt, today)} · {author.city}
            </p>
          </div>
        </div>

        {actionBar}

        <figure className={styles.cover}>
          <img src={cover.src} alt="" />
          <figcaption><PhotoCredit photo={cover} /></figcaption>
        </figure>

        <section className={styles.workoutCard} aria-label="Synced workout">
          <div className={styles.workoutHead}>
            <span><i className="fa-solid fa-arrows-rotate" aria-hidden="true" /> Synced workout</span>
            <span className={styles.workoutDevices}>
              {post.devices.map((d) => <DeviceChip key={d} id={d} />)}
            </span>
          </div>
          <p className={styles.workoutLabel}>{post.activity.label}</p>
          <dl className={styles.statGrid}>
            {post.activity.stats.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {post.activity.zones && (
            <div className={styles.zones}>
              <div className={styles.zoneBar}>
                {post.activity.zones.map((pct, i) => (
                  <span key={i} style={{ width: `${pct}%`, background: ZONE_COLORS[i] }} title={`Zone ${i + 1}: ${pct}%`} />
                ))}
              </div>
              <div className={styles.zoneLegend}>
                {post.activity.zones.map((pct, i) => (
                  <span key={i}><i style={{ background: ZONE_COLORS[i] }} /> Z{i + 1} {pct}%</span>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className={styles.body}>
          {post.body.map((block, i) => {
            if (block.h) return <h2 key={i}>{block.h}</h2>;
            if (block.quote) return <blockquote key={i}>{block.quote}</blockquote>;
            if (block.list) return <ul key={i}>{block.list.map((li) => <li key={li}>{li}</li>)}</ul>;
            return <p key={i}>{block.p}</p>;
          })}
        </div>

        <div className={styles.tagRow}>
          <span className={styles.topicPill}>{post.topic}</span>
          <SampleDataBadge label="Sample community post" />
        </div>

        {actionBar}

        <section className={styles.authorCard}>
          <Avatar seed={post.author} look={AUTHORS[post.author].look} size={64} title={author.name} />
          <div>
            <h2>Written by {author.name}</h2>
            <p className={styles.metaLine}>{(author.followers + (following ? 1 : 0)).toLocaleString('en-IN')} followers · {author.city}</p>
            <p>{author.bio}</p>
          </div>
          <button className={following ? styles.followingBtn : styles.followBtn} onClick={() => follows.toggle(post.author)} aria-pressed={following}>
            {following ? 'Following' : 'Follow'}
          </button>
        </section>

        <section id="responses" className={styles.responses}>
          <h2>Responses ({post.responses.length + myResponses.list.length})</h2>
          <form onSubmit={respond} className={styles.respondForm}>
            <Avatar seed="you" size={32} title="You" />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="What are your thoughts?"
              rows={2}
              maxLength={600}
            />
            <button type="submit" className={styles.followBtn} disabled={!draft.trim()}>Respond</button>
          </form>
          <p className={styles.metaLine}>Your responses are saved on this device only.</p>
          <ul className={styles.responseList}>
            {[...myResponses.list].reverse().map((r) => (
              <li key={r.id}>
                <div className={styles.byline}><Avatar seed="you" size={28} title="You" /> <strong>You</strong> · just now</div>
                <p>{r.text}</p>
              </li>
            ))}
            {post.responses.map((r, i) => (
              <li key={i}>
                <div className={styles.byline}>
                  <Avatar seed={r.author} look={AUTHORS[r.author].look} size={28} title={AUTHORS[r.author].name} /> <strong>{AUTHORS[r.author].name}</strong>
                </div>
                <p>{r.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <section className={styles.moreSection}>
        <h2>More from the community</h2>
        <div className={styles.moreGrid}>
          {more.map((p) => (
            <Link key={p.slug} href={`/blogs/${p.slug}`} className={styles.moreCard}>
              <img src={photo(p.cover).src} alt="" loading="lazy" />
              <span className={styles.byline}>
                <Avatar seed={p.author} look={AUTHORS[p.author].look} size={20} title={AUTHORS[p.author].name} /> {AUTHORS[p.author].name}
              </span>
              <strong>{p.title}</strong>
              <small>{readMinutes(p)} min read · <i className="fa-solid fa-hands-clapping" aria-hidden="true" /> {p.claps.toLocaleString('en-IN')}</small>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
