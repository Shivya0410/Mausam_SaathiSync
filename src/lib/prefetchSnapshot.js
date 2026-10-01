// Early snapshot request (PRD 13.8): an inline script in <head> starts the
// weather request while the app's JavaScript is still downloading, and
// fetchSnapshot reuses it. `snapshotPrefetchUrl` must be self-contained
// (no imports, no outer variables): the layout serialises it with
// Function.prototype.toString. A test keeps its URLs equal to snapshotUrl.

/**
 * @param {(k: string) => string|null} getItem localStorage.getItem
 * @param {string} search location.search
 * @param {object|undefined} connection navigator.connection
 * @param {{ demoMode: boolean, scenarioIds: string[], defaultPlace: object }} cfg
 * @returns {string|null} the URL the app will request first, or null
 */
export function snapshotPrefetchUrl(getItem, search, connection, cfg) {
  const read = (k, d) => {
    try {
      const v = getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch (e) {
      return d;
    }
  };
  // Guest or Google-remembered identity only; signed-in users are skipped.
  let who = 'guest';
  const g = read('swasth.google.account', null);
  if (g && g.email) who = 'google:' + String(g.email).toLowerCase();
  if (getItem('token')) return null;
  const places = read('mausam.places.v1::' + who, []);
  const current = read('mausam.currentPlace.v1::' + who, { id: null });
  let place = null;
  for (let i = 0; i < places.length; i++) if (places[i].id === current.id) place = places[i];
  place = place || places[0] || cfg.defaultPlace;

  let demo = null;
  if (cfg.demoMode) {
    const q = new URLSearchParams(search).get('demo');
    const stored = read('mausam.demo.v1', { scenario: null }).scenario;
    const pick = q === 'off' ? null : q || stored;
    demo = pick && cfg.scenarioIds.indexOf(pick) >= 0 ? pick : null;
  }
  const a11y = read('mausam.a11y.v1', {});
  const slow = !!connection && (connection.saveData === true || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  const lite = a11y.lite == null ? slow : a11y.lite;
  const ps = read('mausam.personas.v1::' + who, { primary: null, secondary: [] });
  const ids = [ps.primary].concat(ps.secondary || []);
  const sea = ids.indexOf('coast') >= 0 || ids.indexOf('fisher') >= 0 || !!demo;
  const include = lite ? 'warnings,sun' : 'air,warnings,sun' + (sea ? ',marine' : '');

  const p = new URLSearchParams({ lat: Number(place.lat).toFixed(2), lon: Number(place.lon).toFixed(2), include: include, lang: 'en' });
  if (place.name) p.set('name', String(place.name).slice(0, 80));
  if (place.district) p.set('district', String(place.district).slice(0, 80));
  if (place.state) p.set('state', String(place.state).slice(0, 80));
  if (demo) p.set('demo', demo);
  return '/api/mausam/snapshot?' + p.toString();
}

/** Inline script source for <head>. */
export function prefetchScript(cfg) {
  return `(function(){try{var u=(${snapshotPrefetchUrl.toString()})(function(k){return localStorage.getItem(k)},location.search,navigator.connection,${JSON.stringify(cfg)});if(u&&location.pathname!=='/onboarding'){window.__msPrefetch={url:u,promise:fetch(u).then(function(r){return r.ok?r.json():Promise.reject(new Error('http_'+r.status))})}}}catch(e){}})();`;
}
