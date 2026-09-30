"use client";

import { useCallback, useState } from 'react';

/**
 * Browser location, only when the user asks (never on page load, PRD 20.2).
 * The exact position stays on the phone: callers round it before sending
 * anything to the server.
 */
export function useGeolocation() {
  const [state, setState] = useState({ status: 'idle', coords: null, error: null });
  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'error', coords: null, error: 'unsupported' });
      return Promise.resolve(null);
    }
    setState({ status: 'loading', coords: null, error: null });
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracyM: pos.coords.accuracy };
          setState({ status: 'ready', coords, error: null });
          resolve(coords);
        },
        (err) => {
          setState({ status: 'error', coords: null, error: err.code === 1 ? 'denied' : 'unavailable' });
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
      );
    });
  }, []);
  return { ...state, request };
}
