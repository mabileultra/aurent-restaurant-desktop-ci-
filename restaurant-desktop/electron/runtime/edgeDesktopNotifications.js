const { requestJson, cloudBase } = require('./edgeHttp');
const { getLiveCloudSession, clearLiveCloudSessionMemory } = require('./edgeLiveSync');

/**
 * Super-admin desktop broadcasts via cloud (same API as Aurent Cashier).
 * Needs live cloud session (admin bootstrap). Offline → skip.
 */
async function fetchUnreadDesktopNotifications() {
  const session = getLiveCloudSession();
  if (!session?.token) {
    return { skipped: true, reason: 'no-session', items: [], unreadCount: 0 };
  }
  try {
    const res = await requestJson(`${cloudBase()}/cashier/desktop-notifications`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    return {
      skipped: false,
      items,
      unreadCount: Number(res.data?.unreadCount || items.length) || 0,
    };
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      clearLiveCloudSessionMemory();
    }
    return {
      skipped: true,
      reason: err?.message || String(err),
      items: [],
      unreadCount: 0,
    };
  }
}

async function markDesktopNotificationRead(id) {
  const session = getLiveCloudSession();
  if (!session?.token || !id) {
    return { ok: false, reason: 'no-session' };
  }
  try {
    await requestJson(`${cloudBase()}/cashier/desktop-notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
    });
    return { ok: true };
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      clearLiveCloudSessionMemory();
    }
    return { ok: false, reason: err?.message || String(err) };
  }
}

module.exports = {
  fetchUnreadDesktopNotifications,
  markDesktopNotificationRead,
};
