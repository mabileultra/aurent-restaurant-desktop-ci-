import { api } from '../../../api/client';

/**
 * LAN-wide single print-relay leader.
 * Prefers edge server lease (/edge/print-relay/lease); falls back to localStorage
 * when the lease API is unavailable (cloud-only / non-edge).
 */
const LOCK_KEY = 'rst-print-relay-leader';
const HEARTBEAT_MS = 1500;
const STALE_MS = 4000;

function readLock() {
  try {
    return JSON.parse(localStorage.getItem(LOCK_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeLock(ownerId, at = Date.now()) {
  localStorage.setItem(LOCK_KEY, JSON.stringify({ ownerId, at }));
}

export function createPrintRelayLeader({ storeId } = {}) {
  const ownerId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let timer = null;
  let serverFails = 0;
  let lastLeader = false;
  const preferServer = storeId != null;

  const localIsLeader = () => {
    const lock = readLock();
    const now = Date.now();
    if (!lock?.ownerId || !lock.at || now - lock.at > STALE_MS) {
      writeLock(ownerId, now);
      return true;
    }
    if (lock.ownerId === ownerId) {
      writeLock(ownerId, now);
      return true;
    }
    return false;
  };

  const heartbeat = async () => {
    if (preferServer && storeId != null && serverFails < 8) {
      try {
        const { data } = await api.post('/edge/print-relay/lease', {
          storeId: Number(storeId),
          ownerId,
          ownerLabel: typeof navigator !== 'undefined' ? navigator.userAgent?.slice(0, 120) : null,
        });
        serverFails = 0;
        lastLeader = Boolean(data?.leader);
        return lastLeader;
      } catch {
        serverFails += 1;
      }
    }
    lastLeader = localIsLeader();
    return lastLeader;
  };

  const isLeader = () => lastLeader;

  const start = () => {
    if (!preferServer) lastLeader = localIsLeader();
    void heartbeat();
    if (timer == null) {
      timer = window.setInterval(() => {
        void heartbeat();
      }, HEARTBEAT_MS);
    }
  };

  const stop = () => {
    if (timer != null) window.clearInterval(timer);
    timer = null;
    const lock = readLock();
    if (lock?.ownerId === ownerId) {
      localStorage.removeItem(LOCK_KEY);
    }
    lastLeader = false;
  };

  return { ownerId, isLeader, start, stop };
}
