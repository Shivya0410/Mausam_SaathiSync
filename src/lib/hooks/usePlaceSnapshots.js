"use client";

import { useEffect, useState } from 'react';
import { fetchSnapshot, snapshotUrl } from './useSnapshot';

/** Snapshots for several places (home, work, a beach), keyed by place id. */
export function usePlaceSnapshots(places, { include = 'air,warnings,sun', lang = 'en', demo = null } = {}) {
  const [data, setData] = useState({});
  const list = places.filter(Boolean);
  const key = list.map((p) => `${p.id}:${p.lat}:${p.lon}`).join('|') + `|${include}|${lang}|${demo}`;
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      list.map((p) =>
        fetchSnapshot(snapshotUrl(p, { include, lang, demo }))
          .then((s) => [p.id, s])
          .catch(() => [p.id, null]),
      ),
    ).then((pairs) => {
      if (!cancelled) setData(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
    // `key` covers every input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return data;
}
