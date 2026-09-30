"use client";

import { useSyncExternalStore } from 'react';
import { localToday } from '../data/fitnessEvents';

const subscribe = () => () => {};

/**
 * Today's local date (YYYY-MM-DD) in the browser, or null during the server
 * render and hydration.
 *
 * Pages are prerendered at build time, so "today" on the server is the build
 * date and may not be the viewer's date. Returning null from the server
 * snapshot lets React hydrate without a mismatch and then re-render with the
 * real date, without a setState-in-effect round trip.
 */
export default function useToday() {
  return useSyncExternalStore(subscribe, () => localToday(), () => null);
}
