/**
 * Repository factory.
 *
 * The single place that decides which persistence adapter the application
 * uses. Adding a durable store means adding a sibling module implementing the
 * contract in ./types.js and one branch here.
 *
 * The instance is cached on globalThis rather than in a module-scoped `let`,
 * because Next.js reloads modules between requests in development and a plain
 * module variable would silently reset the in-memory data on every edit,
 * making it look as though writes were failing.
 */

import { createMemoryRepositories } from './memory.js';

const CACHE_KEY = Symbol.for('swasth.repositories');

export function getRepositories() {
  const store = globalThis;

  if (!store[CACHE_KEY]) {
    // When DATABASE_URL is authorised and an adapter exists, branch here.
    // Until then the only implementation is explicitly non-durable.
    store[CACHE_KEY] = createMemoryRepositories();
  }

  return store[CACHE_KEY];
}
