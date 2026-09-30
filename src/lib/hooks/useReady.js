"use client";

import { useCallback, useState } from 'react';
import { useStore } from './useStore';
import { stores } from '../stores';
import { earnedBadges, awardBadges } from '../mausam/ready';

/**
 * Be ready state with badge awarding on every change (PRD 9.4).
 * Returns [state, update(fn), fresh] where `fresh` lists badges earned by
 * the last update (for a one-time notice).
 */
export function useReady() {
  const [state, setState] = useStore(stores.ready);
  const [cv] = useStore(stores.cvStats);
  const [myReports] = useStore(stores.myReports);
  const [fresh, setFresh] = useState([]);
  const update = useCallback(
    (fn) => {
      let got = [];
      setState((prev) => {
        const next = fn ? fn(prev) : prev;
        const r = awardBadges(next, earnedBadges(next, { skySnaps: cv.skySnaps, myReports }), new Date().toISOString());
        got = r.fresh;
        return r.state;
      });
      if (got.length) setFresh(got);
    },
    [setState, cv.skySnaps, myReports],
  );
  return [state, update, fresh];
}
