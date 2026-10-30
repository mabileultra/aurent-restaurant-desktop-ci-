const { probeHealth } = require('./health');
const {
  refreshLiveFromCloud,
  pushLiveToCloud,
  getLastPushedOrigins,
  getLiveCloudSession,
} = require('./edgeLiveSync');
const { probeLocalOrigins, originsNeedPush } = require('./edgeLiveOriginProbe');
const { refreshStaffRosterFromCloud } = require('./edgeStaffCloudRefresh');
const { refreshCatalogFromCloud } = require('./edgeCatalogCloudRefresh');
const { refreshStockFromCloud } = require('./edgeStockCloudRefresh');
const { getOutboxCounts, flushEdgeOutbox } = require('./edgeOutboxFlush');
const { HEALTH_URL } = require('../config');

/** Full live push/pull backup while online (Phase D). */
const LIVE_SYNC_MS = 5_000;
/** Cheap origin watch — push as soon as hall floor watermark grows (Stage 2). */
const ORIGIN_PROBE_MS = 1_000;
const STAFF_REFRESH_MS = 60_000;
/** Menu/halls/stations — infrequent; heavy export (Phase E). */
const CATALOG_REFRESH_MS = 15 * 60_000;
/** Stock products + suppliers + stores (Phase F). */
const STOCK_REFRESH_MS = 15 * 60_000;
const LOOP_MS = 1_000;

function probeCloudOnline() {
  return new Promise((resolve) => {
    try {
      const https = require('https');
      const req = https.get(
        'https://r-aurent.uz/api/v1/actuator/health',
        { timeout: 4000 },
        (res) => {
          res.resume();
          resolve(res.statusCode >= 200 && res.statusCode < 500);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Background online reconcile — no chrome indicators.
 * Local edge stays for months-offline; when uplink is up: outbox flush, floor push/pull, staff refresh.
 */
function startEdgeOnlineReconcileLoop({ publishStatus, getLastStatus }) {
  let syncInFlight = false;
  let lastLiveSyncAt = 0;
  let liveSyncInFlight = false;
  let lastOriginProbeAt = 0;
  let lastStaffRefreshAt = 0;
  let staffRefreshInFlight = false;
  let lastCatalogRefreshAt = 0;
  let catalogRefreshInFlight = false;
  let lastStockRefreshAt = 0;
  let stockRefreshInFlight = false;
  let wasOnline = false;
  let lastCloudProbeAt = 0;
  let cachedOnline = false;

  async function runLiveRound() {
    if (liveSyncInFlight) return;
    liveSyncInFlight = true;
    lastLiveSyncAt = Date.now();
    try {
      await pushLiveToCloud();
      await refreshLiveFromCloud();
      publishStatus({ floorSyncedAt: Date.now() });
    } catch {
      /* next tick */
    } finally {
      liveSyncInFlight = false;
    }
  }

  const timer = setInterval(async () => {
    const lastStatus = typeof getLastStatus === 'function' ? getLastStatus() : {};
    const hit = await probeHealth(HEALTH_URL);

    // Cloud probe is slower — cache ~4s so 1s loop stays light.
    if (Date.now() - lastCloudProbeAt >= 4_000) {
      lastCloudProbeAt = Date.now();
      cachedOnline = await probeCloudOnline();
    }
    const online = cachedOnline;

    let pendingOutbox = lastStatus.pendingOutbox || 0;
    try {
      const counts = await getOutboxCounts();
      pendingOutbox = counts.pending + counts.failed;
    } catch {
      /* keep last */
    }
    const session = getLiveCloudSession();
    const liveSession = Boolean(session?.token && session.storeIds?.length);
    publishStatus({
      serviceHealthy: hit.ok,
      pendingOutbox,
      online,
      liveSession,
    });

    const justCameOnline = online && !wasOnline;
    wasOnline = online;

    // Quiet flush: on reconnect always; while online whenever queue non-empty.
    if (online && !syncInFlight && (justCameOnline || pendingOutbox > 0)) {
      syncInFlight = true;
      try {
        const flush = await flushEdgeOutbox({
          maxRounds: justCameOnline ? 20 : 5,
          pauseMs: justCameOnline ? 150 : 250,
        });
        pendingOutbox = Number(flush.pending || 0) + Number(flush.failed || 0);
        publishStatus({
          pendingOutbox,
          lastFlushPushed: Number(flush.pushed || 0),
          lastFlushAt: Date.now(),
        });
      } catch {
        /* next tick */
      } finally {
        syncInFlight = false;
      }
    }

    // Phase B: roster immediately on reconnect, then every STAFF_REFRESH_MS.
    if (
      online
      && !staffRefreshInFlight
      && (justCameOnline || Date.now() - lastStaffRefreshAt >= STAFF_REFRESH_MS)
    ) {
      staffRefreshInFlight = true;
      lastStaffRefreshAt = Date.now();
      try {
        const roster = await refreshStaffRosterFromCloud();
        if (roster && !roster.skipped) {
          publishStatus({ rosterRefreshedAt: Date.now() });
        }
      } catch {
        /* next tick */
      } finally {
        staffRefreshInFlight = false;
      }
    }

    // Stage 2: when local origin grows, push+pull immediately (not wait 5s).
    if (
      online
      && liveSession
      && !liveSyncInFlight
      && Date.now() - lastOriginProbeAt >= ORIGIN_PROBE_MS
    ) {
      lastOriginProbeAt = Date.now();
      try {
        const origins = await probeLocalOrigins(session);
        if (originsNeedPush(origins, getLastPushedOrigins())) {
          await runLiveRound();
        }
      } catch {
        /* next tick */
      }
    }

    // Backup full live round (covers cloud→hall while hall idle).
    if (
      online
      && !liveSyncInFlight
      && (justCameOnline || Date.now() - lastLiveSyncAt >= LIVE_SYNC_MS)
    ) {
      await runLiveRound();
    }

    // Phase E: catalog after reconnect, then every CATALOG_REFRESH_MS (quiet).
    if (
      online
      && !catalogRefreshInFlight
      && (justCameOnline || Date.now() - lastCatalogRefreshAt >= CATALOG_REFRESH_MS)
    ) {
      catalogRefreshInFlight = true;
      lastCatalogRefreshAt = Date.now();
      try {
        const catalog = await refreshCatalogFromCloud();
        if (catalog && !catalog.skipped) {
          publishStatus({ catalogRefreshedAt: Date.now() });
        }
      } catch {
        /* next tick */
      } finally {
        catalogRefreshInFlight = false;
      }
    }

    // Phase F: stock/refs after reconnect, then every STOCK_REFRESH_MS (quiet).
    if (
      online
      && !stockRefreshInFlight
      && (justCameOnline || Date.now() - lastStockRefreshAt >= STOCK_REFRESH_MS)
    ) {
      stockRefreshInFlight = true;
      lastStockRefreshAt = Date.now();
      try {
        const stock = await refreshStockFromCloud();
        if (stock && !stock.skipped) {
          publishStatus({ stockRefreshedAt: Date.now() });
        }
      } catch {
        /* next tick */
      } finally {
        stockRefreshInFlight = false;
      }
    }
  }, LOOP_MS);

  return () => clearInterval(timer);
}

module.exports = { startEdgeOnlineReconcileLoop };
