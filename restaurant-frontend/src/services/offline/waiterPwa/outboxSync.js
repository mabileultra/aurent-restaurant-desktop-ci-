/** Flush waiter PWA outbox → cloud local-events, else LAN hub on station. */

import { api } from '../../../api/client';
import { idbGetAll, idbPut } from './idb';

const BACKOFF_MS = [2_000, 5_000, 15_000, 30_000, 60_000];
const HUB_URL_KEY = 'rst-lan-hub-url';

let ticking = false;

function nextRetryIso(attemptCount) {
  const ms = BACKOFF_MS[Math.min(Math.max(attemptCount, 1), BACKOFF_MS.length) - 1];
  return new Date(Date.now() + ms).toISOString();
}

export function getConfiguredHubUrl() {
  try {
    return String(localStorage.getItem(HUB_URL_KEY) || '').replace(/\/$/, '');
  } catch {
    return '';
  }
}

export function setConfiguredHubUrl(url) {
  try {
    if (!url) localStorage.removeItem(HUB_URL_KEY);
    else localStorage.setItem(HUB_URL_KEY, String(url).replace(/\/$/, ''));
  } catch {
    /* ignore */
  }
}

async function postToHub(hubBase, body) {
  const res = await fetch(`${hubBase}/hub/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`hub_http_${res.status}:${text.slice(0, 120)}`);
  }
  return res.json().catch(() => ({ outcome: 'ACCEPTED' }));
}

function acceptedOutcome(raw) {
  const outcome = String(raw || 'ACCEPTED').toUpperCase();
  if (outcome === 'ACCEPTED' || outcome === 'ALREADY_PROCESSED' || outcome === 'OK') return outcome;
  return null;
}

/**
 * Prefer LAN hub (cashier station), then cloud.
 * Hub apply writes SQLite + station outbox; cloud-only left the cashier empty.
 */
export async function deliverWaiterOutboxEvent({ storeId, hubUrl, body }) {
  let hubOutcome = null;
  let hubErr = null;
  if (hubUrl) {
    try {
      const hubRes = await postToHub(hubUrl, body);
      hubOutcome = acceptedOutcome(hubRes?.outcome);
      if (!hubOutcome) hubErr = new Error(`unexpected_hub_outcome:${hubRes?.outcome}`);
    } catch (err) {
      hubErr = err;
    }
  }

  let cloudOutcome = null;
  let cloudErr = null;
  // Hub already printed on the monoblock — don't let cloud create a second kitchen job.
  const cloudBody = hubOutcome && body?.eventType === 'ORDER_SEND_KITCHEN'
    ? {
      ...body,
      payload: { ...(body.payload || {}), printOnServer: false },
    }
    : body;
  try {
    const res = await api.post(`/rst/stores/${storeId}/local-events`, cloudBody);
    cloudOutcome = acceptedOutcome(res?.data?.outcome || res?.data?.status);
    if (!cloudOutcome) cloudErr = new Error(`unexpected_ingest_outcome:${res?.data?.outcome}`);
  } catch (err) {
    cloudErr = err;
  }

  if (hubOutcome || cloudOutcome) return hubOutcome || cloudOutcome;
  throw hubErr || cloudErr || new Error('outbox_deliver_failed');
}

/** Pull floor/menu/orders from station hub (peer / waiter offline read). */
export async function fetchHubSnapshot(hubBase = getConfiguredHubUrl()) {
  const base = String(hubBase || '').replace(/\/$/, '');
  if (!base) return null;
  const res = await fetch(`${base}/hub/snapshot`);
  if (!res.ok) throw new Error(`hub_snapshot_http_${res.status}`);
  return res.json();
}

export async function tickWaiterOutbox({ storeId, limit = 20 } = {}) {
  if (ticking) return { busy: true, results: [] };
  if (storeId == null) return { busy: false, results: [] };
  ticking = true;
  const results = [];
  const hubUrl = getConfiguredHubUrl();
  try {
    const rows = (await idbGetAll('outbox'))
      .filter((r) => r.status === 'PENDING' || r.status === 'RETRY')
      .filter((r) => !r.nextRetryAt || Date.parse(r.nextRetryAt) <= Date.now())
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      .slice(0, limit);

    for (const row of rows) {
      const sending = {
        ...row,
        status: 'SENDING',
        sentAt: new Date().toISOString(),
      };
      await idbPut('outbox', sending);
      const body = {
        deviceId: row.deviceId,
        clientEventId: row.clientEventId,
        eventType: row.eventType,
        payload: row.payload || {},
      };
      try {
        // Hub first when set — cashier SQLite + printers see punches immediately.
        // Cloud alone left the station blind while the phone looked "synced".
        const outcome = await deliverWaiterOutboxEvent({ storeId, hubUrl, body });
        await idbPut('outbox', { ...sending, status: 'SYNCED', error: null, nextRetryAt: null });
        results.push({ id: row.id, status: 'SYNCED', outcome });
      } catch (err) {
        const attemptCount = (row.attemptCount || 0) + 1;
        await idbPut('outbox', {
          ...sending,
          status: 'RETRY',
          attemptCount,
          error: String(err?.message || err),
          nextRetryAt: nextRetryIso(attemptCount),
        });
        results.push({ id: row.id, status: 'RETRY', error: String(err?.message || err) });
      }
    }
    return { busy: false, results };
  } finally {
    ticking = false;
  }
}

export async function countPendingOutbox() {
  const rows = await idbGetAll('outbox');
  return rows.filter((r) => r.status === 'PENDING' || r.status === 'RETRY' || r.status === 'SENDING').length;
}
