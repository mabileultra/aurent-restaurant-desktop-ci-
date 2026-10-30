const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');
const { getLiveCloudSession } = require('./edgeLiveSync');

function mapStaffRows(staff, companyLoginCode) {
  return (Array.isArray(staff) ? staff : []).map((s) => ({
    userId: s.userId,
    username: s.username,
    email: s.email,
    fullName: s.fullName,
    role: s.role,
    passwordHash: s.passwordHash,
    pinHash: s.pinHash,
    storeIds: s.storeIds,
    allowedModules: s.allowedModules,
    canRequestBill: s.canRequestBill,
    active: s.active,
    companyLoginCode: s.companyLoginCode || companyLoginCode,
  }));
}

/**
 * While online: upsert cloud staff hashes into local roster (S3).
 * replaceRoster=false — do not deactivate hall-only users created on the PC.
 */
async function refreshStaffRosterFromCloud() {
  const session = getLiveCloudSession();
  if (!session?.token || !session.companyId) {
    return { skipped: true, reason: 'no-session' };
  }
  const exported = await requestJson(`${cloudBase()}/users/edge-staff-export`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const companyId = exported.data?.companyId || session.companyId;
  const companyLoginCode = exported.data?.companyLoginCode || session.companyLoginCode;
  const staff = exported.data?.staff || [];
  const secret = bootstrapSecret(session.bootstrapSecret);
  const local = await requestJson(`${localBase()}/edge/auth/bootstrap-staff`, {
    method: 'POST',
    body: {
      companyId,
      companyLoginCode,
      bootstrapSecret: secret,
      replaceRoster: false,
      staff: mapStaffRows(staff, companyLoginCode),
    },
  });
  return {
    refreshed: true,
    saved: Number(local.data?.saved || 0),
    staffCount: staff.length,
  };
}

module.exports = { refreshStaffRosterFromCloud, mapStaffRows };
