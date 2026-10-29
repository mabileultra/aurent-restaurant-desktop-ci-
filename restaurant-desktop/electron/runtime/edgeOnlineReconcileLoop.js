const { probeHealth } = require('./health');
const { refreshLiveFromCloud, pushLiveToCloud } = require('./edgeLiveSync');
const { refreshStaffRosterFromCloud } = require('./edgeStaffCloudRefresh');
const { refreshCatalogFromCloud } = require('./edgeCatalogCloudRefresh');
const { refreshStockFromCloud } = require('./edgeStockCloudRefresh');
const { getOutboxCounts, flushEdgeOutbox } = require('./edgeOutboxFlush');
const { HEALTH_URL } = require('../config');

/** Floor/kitchen live — ~5s while online; immediate on reconnect (Phase D). */
const LIVE_SYNC_MS = 5_000;
const STAFF_REFRESH_MS = 60_000;
/** Menu/halls/stations — infrequent; heavy export (Phase E). */
const CATALOG_REFRESH_MS = 15 * 60_000;
/** Stock products + suppliers + stores (Phase F). */
const STOCK_REFRESH_MS = 15 * 60_000;

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
  let lastStaffRefreshAt = 0;
  let staffRefreshInFlight = false;
  let lastCatalogRefreshAt = 0;
  let catalogRefreshInFlight = false;
  let lastStockRefreshAt = 0;
  let stockRefreshInFlight = false;
  let wasOnline = false;

  const timer = setInterval(async () => {
    const lastStatus = typeof getLastStatus === 'function' ? getLastStatus() : {};
    const hit = await probeHealth(HEALTH_URL);
    const online = await probeCloudOnline();
    let pendingOutbox = lastStatus.pendingOutbox || 0;
    try {
      const counts = await getOutboxCounts();
      pendingOutbox = counts.pending + counts.failed;
    } catch {
      /* keep last */
    }
    publishStatus({ serviceHealthy: hit.ok, pendingOutbox, online });

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

    if (
      online
      && !liveSyncInFlight
      && (justCameOnline || Date.now() - lastLiveSyncAt >= LIVE_SYNC_MS)
    ) {
      liveSyncInFlight = true;
      lastLiveSyncAt = Date.now();
      try {
        // Hall SoT first, then pull (phones / other nodes). Same mutex as before.
        await pushLiveToCloud();
        await refreshLiveFromCloud();
        publishStatus({ floorSyncedAt: Date.now() });
      } catch {
        /* next tick */
      } finally {
        liveSyncInFlight = false;
      }
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
  }, 5000);

  return () => clearInterval(timer);
}

module.exports = { startEdgeOnlineReconcileLoop };
