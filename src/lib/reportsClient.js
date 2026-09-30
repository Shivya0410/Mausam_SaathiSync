"use client";

// Browser side of crowd reports: device id, submit, vote. The device id is a
// random value that never identifies a person; the server keeps only a
// salted hash of it (PRD 11.2).

import { stores } from './stores';

export function deviceId() {
  const cur = stores.device.read(null);
  if (cur.clientId) return cur.clientId;
  const id = `d-${crypto.randomUUID()}`;
  stores.device.write(null, { clientId: id });
  return id;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error?.message || `HTTP ${res.status}`);
    err.code = json?.error?.code || 'network';
    err.fields = json?.error?.details?.fields;
    throw err;
  }
  return json;
}

/** Submit a report and remember it on this device ("My reports"). */
export async function submitReport(payload) {
  const { report } = await post('/api/mausam/reports', { ...payload, clientId: deviceId() });
  stores.myReports.write(null, (list) => [{ ...report, submittedAt: new Date().toISOString() }, ...list].slice(0, 50));
  return report;
}

/**
 * "Still there?" vote. Demo reports are voted on locally only (they do not
 * exist on the server).
 */
export async function voteOnReport(report, vote) {
  stores.reportVotes.write(null, (v) => ({ ...v, [report.id]: vote }));
  if (report.demo) return { ...report, confirmations: report.confirmations + (vote === 'still' ? 1 : 0), clears: (report.clears || 0) + (vote === 'cleared' ? 1 : 0) };
  const { report: updated } = await post(`/api/mausam/reports/${encodeURIComponent(report.id)}/vote`, { vote, clientId: deviceId() });
  return updated;
}

export async function sendFeedback(body) {
  return post('/api/mausam/feedback', body);
}

/**
 * Card "Helpful?" answers, sent anonymously for tuning rules (PRD 13.3).
 * Fire and forget: the local record is what the UI shows.
 */
export function sendCardFeedback(card, helpful, lang) {
  if (!card?.ruleId) return;
  sendFeedback({ kind: 'card', ruleId: card.ruleId.slice(0, 60), helpful, lang: lang === 'hi' ? 'hi' : 'en', page: window.location.pathname.slice(0, 120) }).catch(() => {});
}
