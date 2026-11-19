import { cashierTerminalApi } from '../../api/cashierTerminal.api';
import { resolveCashierTerminalIdentity, buildTerminalRequest } from '../../utils/cashierTerminalIdentity';
import { isApiUnreachableError } from '../../utils/apiNetworkError';
import {
  offlineOpenShift,
  isDesktopOfflineBridge,
  offlineSyncShiftFromServer,
  offlineCloseShift,
} from '../offline/desktopOfflineBridge';
import { loadFiscalContext, wrapFiscalError } from '../fiscal';
import { routeFor, shiftApi } from './posRouterShared';

export async function posOpenShift(storeId, user, storeName = '', { catalogKind } = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local') {
    const shift = await offlineOpenShift({
      storeId,
      cashierId: user?.id,
      cashierName: user?.fullName || user?.username || '',
      storeName,
    });
    if (!shift) throw new Error('OFFLINE_SHIFT_OPEN_FAILED');
    return shift;
  }
  const apiClient = shiftApi(catalogKind);
  try {
    const identity = await resolveCashierTerminalIdentity();
    const terminal = buildTerminalRequest(identity);
    let body;
    if (catalogKind === 'pharmacy') {
      let cashRegisterId;
      let registerNumber;
      if (terminal) {
        try {
          const reg = await cashierTerminalApi.register(storeId, terminal).then((r) => r.data);
          cashRegisterId = reg?.cashRegisterId;
          registerNumber = reg?.registerNumber;
        } catch {
          /* open shift without register binding — Multikassa falls back to store register */
        }
      }
      body = {
        storeName: storeName || undefined,
        cashierName: user?.fullName || user?.username || undefined,
        ...(cashRegisterId != null ? { cashRegisterId, registerNumber } : {}),
      };
    } else {
      body = terminal ? { terminal } : null;
    }
    const res = await apiClient.open(storeId, body);
    const shift = res.data;
    if (user?.id && isDesktopOfflineBridge()) {
      try {
        await offlineSyncShiftFromServer({
          shift,
          storeId,
          cashierId: user.id,
          cashierName: user.fullName || user.username || '',
          storeName: storeName || shift.storeName || '',
        });
      } catch {
        /* mirror best-effort */
      }
    }
    try {
      const fiscal = await loadFiscalContext(storeId, shift?.cashRegisterId);
      if (fiscal.capabilities.enabled) {
        await fiscal.provider.openShift({
          capabilities: fiscal.capabilities,
          shiftId: shift?.id,
          cashierName: user?.fullName || user?.name || 'CASHIER',
          contractorName: storeName,
        });
      }
    } catch (err) {
      if (user?.id && isDesktopOfflineBridge()) {
        try {
          await offlineCloseShift({ storeId, cashierId: user.id });
        } catch {
          /* ignore */
        }
      }
      throw wrapFiscalError(err);
    }
    return shift;
  } catch (err) {
    if (isApiUnreachableError(err) && routeFor(storeId).canFallback) {
      const shift = await offlineOpenShift({
        storeId,
        cashierId: user?.id,
        cashierName: user?.fullName || user?.username || '',
        storeName,
      });
      if (!shift) throw new Error('OFFLINE_SHIFT_OPEN_FAILED');
      return shift;
    }
    throw err;
  }
}
