const fs = require('fs');
const path = require('path');
const { app } = require('electron');

function sessionPath() {
  return path.join(app.getPath('userData'), 'edge-live-cloud-session.json');
}

function readLiveCloudSession() {
  try {
    const p = sessionPath();
    if (!fs.existsSync(p)) return null;
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!raw?.token || !Array.isArray(raw.storeIds) || !raw.storeIds.length) return null;
    const storeIds = raw.storeIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0)
      .slice(0, 5);
    if (!storeIds.length) return null;
    return {
      token: String(raw.token),
      companyId: raw.companyId == null ? null : Number(raw.companyId),
      companyLoginCode: raw.companyLoginCode || null,
      storeIds,
      bootstrapSecret: raw.bootstrapSecret || null,
      savedAt: Number(raw.savedAt) || Date.now(),
    };
  } catch {
    return null;
  }
}

function writeLiveCloudSession(session) {
  try {
    if (!session?.token || !session.storeIds?.length) {
      clearLiveCloudSession();
      return;
    }
    fs.writeFileSync(sessionPath(), `${JSON.stringify(session)}\n`, 'utf8');
  } catch {
    /* best-effort */
  }
}

function clearLiveCloudSession() {
  try {
    const p = sessionPath();
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    /* ignore */
  }
}

module.exports = {
  readLiveCloudSession,
  writeLiveCloudSession,
  clearLiveCloudSession,
};
