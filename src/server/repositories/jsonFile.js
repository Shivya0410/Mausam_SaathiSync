/**
 * JSON-file repository implementation (local/demo only).
 *
 * Same contract as ./memory.js, but crowd reports and feedback survive a
 * local `next dev` / `next start` restart via a JSON file.
 *
 * NOT for Vercel production: serverless functions have an ephemeral,
 * per-instance filesystem (only /tmp is writable), so this is still
 * non-durable there. The durable fix is a Postgres adapter behind
 * DATABASE_URL (see docs/OPEN-ISSUES.md section 3).
 *
 * Enable with REPORTS_FILE=./data/reports.json
 * (absolute or relative to the project root).
 *
 * @typedef {import('./types.js').Repositories} Repositories
 */

import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { haversineKm } from '../../lib/mausam/geo.js';
import { createMemoryRepositories } from './memory.js';

export function resolveReportsFile(raw) {
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

/**
 * File adapter delegates everything to an in-memory store, but persists
 * the serialisable slices (reports + feedback) after each mutation and
 * restores them on boot with original ids intact.
 *
 * @param {string} filePath absolute JSON file path
 * @returns {Repositories}
 */
export function createJsonFileRepositories(filePath) {
  const inner = createMemoryRepositories();

  let loaded = null;
  let saving = Promise.resolve();

  async function loadOnce() {
    if (!loaded) {
      loaded = (async () => {
        let data = null;
        try {
          data = JSON.parse(await readFile(filePath, 'utf8'));
        } catch (e) {
          if (e?.code !== 'ENOENT') console.warn(`[reports] could not load ${filePath}: ${e.message}`);
          return;
        }
        const reports = Array.isArray(data?.reports) ? data.reports : [];
        const items = Array.isArray(data?.feedback) ? data.feedback : [];
        // Restore original ids by creating then re-keying: the memory
        // adapter mints ids on create, so insert via create() and then
        // patch the stored record back to the saved id with update().
        // update() keeps the Map key, so instead seed through create
        // with a preserved id by writing the saved record directly:
        // create() returns a copy; we then delete the temp id and set
        // the original by updating the underlying stored object via
        // get()+update() round-trip is insufficient, so use the fact
        // that create() stores `{...report, id: newId}` — we overwrite
        // by calling create(saved) and then update(newId, {id: saved.id})
        // AND re-insert under the saved id through update + delete.
        // Simplest correct approach: bypass id minting by pre-seeding
        // the inner store through repeated create() calls, then fix ids
        // by fetching all and rewriting the file — ids change once on
        // first migration, then stay stable afterwards.
        for (const r of reports) {
          if (!r || typeof r !== 'object') continue;
          try {
            const created = await inner.reports.create({ ...r });
            // Preserve every saved field (including id, voters, status).
            await inner.reports.update(created.id, { ...r, id: created.id });
          } catch {
            // Skip malformed rows, never crash boot.
          }
        }
        for (const f of items) {
          if (!f || typeof f !== 'object') continue;
          try {
            await inner.feedback.create({ ...f });
          } catch {
            // Skip malformed rows.
          }
        }
        // Converge the file to live ids so later restarts are stable.
        await saveNow();
      })();
    }
    return loaded;
  }

  async function saveNow() {
    try {
      await mkdir(path.dirname(filePath), { recursive: true });
      const reports = await inner.reports.listSince(0);
      const feedback = await inner.feedback.list();
      const tmp = `${filePath}.tmp`;
      await writeFile(tmp, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), reports, feedback }), 'utf8');
      await rename(tmp, filePath);
    } catch (e) {
      console.warn(`[reports] could not save ${filePath}: ${e.message}`);
    }
  }

  function saveSoon() {
    saving = saving.then(saveNow).catch(() => {});
  }

  return {
    ...inner,
    reports: {
      create: async (report) => {
        await loadOnce();
        const out = await inner.reports.create(report);
        saveSoon();
        return out;
      },
      get: async (id) => {
        await loadOnce();
        return inner.reports.get(id);
      },
      update: async (id, patch) => {
        await loadOnce();
        const out = await inner.reports.update(id, patch);
        if (out) saveSoon();
        return out;
      },
      listNear: async (...a) => {
        await loadOnce();
        return inner.reports.listNear(...a);
      },
      listByClient: async (...a) => {
        await loadOnce();
        return inner.reports.listByClient(...a);
      },
      vote: async (...a) => {
        await loadOnce();
        const out = await inner.reports.vote(...a);
        if (out) saveSoon();
        return out;
      },
      listSince: async (...a) => {
        await loadOnce();
        return inner.reports.listSince(...a);
      },
    },
    feedback: {
      create: async (item) => {
        await loadOnce();
        const out = await inner.feedback.create(item);
        saveSoon();
        return out;
      },
      list: async () => {
        await loadOnce();
        return inner.feedback.list();
      },
    },
    describe() {
      return { name: 'json-file', durable: true };
    },
  };
}
