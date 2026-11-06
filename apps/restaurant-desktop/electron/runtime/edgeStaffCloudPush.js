const { requestJson, localBase, cloudBase } = require('./edgeHttp');
const { getLiveCloudSession } = require('./edgeLiveSync');

/**
 * Hall → identity staff hashes (S2b). Soft upsert on cloud; local DB stays.
 */
async function pushStaffToCloud() {
  const session = getLiveCloudSession();
  if (!session?.token || !session.companyId) {
    return { skipped: true, reason: 'no-session' };
  }
  try {
    const q = new URLSearchParams({ companyId: String(session.companyId) });
    const local = await requestJson(`${localBase()}/edge/auth/staff-export?${q}`);
    const staff = Array.isArray(local.data?.staff) ? local.data.staff : [];
    if (!staff.length) {
      return { pushed: true, upserted: 0, skipped: 0, empty: true };
    }
    const cloud = await requestJson(`${cloudBase()}/users/edge-staff-ingest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: { staff },
    });
    return {
      pushed: true,
      upserted: Number(cloud.data?.upserted || 0),
      skipped: Number(cloud.data?.skipped || 0),
    };
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      return { pushed: false, authFailed: true, error: err.message || String(err) };
    }
    throw err;
  }
}

module.exports = { pushStaffToCloud };
