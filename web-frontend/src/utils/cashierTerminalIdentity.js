const STORAGE_KEY = 'pos.terminal.deviceId';

export async function resolveCashierTerminalIdentity() {
  if (typeof window !== 'undefined' && window.desktopCashier?.getTerminalIdentity) {
    try {
      return await window.desktopCashier.getTerminalIdentity();
    } catch {
      /* fallback to browser identity */
    }
  }

  let deviceId = null;
  if (typeof localStorage !== 'undefined') {
    deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
  }

  return {
    deviceId,
    equipmentSerial: null,
    equipmentModel: null,
    fiscalCardId: null,
    workstationName:
      typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : null,
  };
}

export function buildTerminalRequest(identity) {
  if (!identity) return null;
  const payload = {
    deviceId: identity.deviceId || undefined,
    equipmentSerial: identity.equipmentSerial || undefined,
    equipmentModel: identity.equipmentModel || undefined,
    fiscalCardId: identity.fiscalCardId || undefined,
    workstationName: identity.workstationName || undefined,
  };
  if (!payload.deviceId && !payload.equipmentSerial) return null;
  return payload;
}
