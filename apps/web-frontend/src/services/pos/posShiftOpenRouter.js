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
    if (isDesktopOfflineBridge() && user?.id) {
      try {
        await offlineSyncShiftFromServer({
          shift,
          storeId,
          cashierId: user.id,
          cashierName: user.fullName || user.username || '',
          storeName: storeName || shift.storeName || '',
        });
      } catch {
        /* ignore */
      }
    }

    let fiscal = null;
    try {
      fiscal = await loadFiscalContext(storeId, shift?.cashRegisterId);
      await fiscal.provider.fiscalizeShift({
        kind: 'open',
        capabilities: fiscal.capabilities,
        shiftId: shift?.id,
        cashierName: user?.fullName || user?.username || shift?.cashierName || 'CASHIER',
        zReportNumber: shift?.zReportId,
      });
    } catch (fiscalErr) {
      // Фискальная смена уже открыта на этом компьютере — POS-смену оставляем.
      if (fiscal?.provider.isShiftAlreadyOpenError(fiscalErr)) {
        return shift;
      }
      try {
        await apiClient.close(shift.id);
      } catch {
        /* best-effort rollback */
      }
      if (isDesktopOfflineBridge() && user?.id) {
        try {
          await offlineCloseShift({ storeId, cashierId: user.id });
        } catch {
          /* ignore */
        }
      }
      throw wrapFiscalError(fiscalErr, fiscal?.provider);
    }

    return shift;
  } catch (e) {
    if (e?.code === 'MULTIKASSA_FISCAL_FAILED' || e?.code === 'MULTIKASSA_OFFLINE_BLOCKED') {
      throw e;
    }
    const msg = String(e.response?.data?.message ?? '');
    if (e.response?.status === 400 && /открыта/i.test(msg)) {
      const res = await apiClient.current(storeId);
      return res.data;
    }
    if (isApiUnreachableError(e) && routeFor(storeId).canFallback && user?.id) {
      const shift = await offlineOpenShift({
        storeId,
        cashierId: user.id,
        cashierName: user.fullName || user.username || '',
        storeName,
      });
      if (!shift) throw new Error('OFFLINE_SHIFT_OPEN_FAILED');
      return shift;
    }
    throw e;
  }
}
