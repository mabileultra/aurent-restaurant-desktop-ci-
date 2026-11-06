const STORAGE_KEY = 'pos.terminal.deviceId';

/** randomUUID needs secure context; lab HTTP / older WebViews need a fallback. */
function newDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `term-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
      deviceId = newDeviceId();
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
