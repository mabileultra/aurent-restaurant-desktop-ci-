/**
 * Only one Aurent window per machine should poll/print — avoids dual claim + stuck spooler.
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

export function createPrintRelayLeader() {
  const ownerId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let timer = null;

  const isLeader = () => {
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

  // Called again on every caps refresh: a second interval would outlive stop() and hold the lock forever.
  const start = () => {
    isLeader();
    if (timer == null) timer = window.setInterval(isLeader, HEARTBEAT_MS);
  };

  const stop = () => {
    if (timer != null) window.clearInterval(timer);
    timer = null;
    const lock = readLock();
    if (lock?.ownerId === ownerId) {
      localStorage.removeItem(LOCK_KEY);
    }
  };

  return { ownerId, isLeader, start, stop };
}
