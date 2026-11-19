import { isApiUnreachableError } from '../../utils/apiNetworkError';
import {
  offlineGetCurrentShift,
  isDesktopOfflineBridge,
  offlineCloseShift,
  offlineSyncShiftFromServer,
  offlineListMySales,
} from '../offline/desktopOfflineBridge';
import { buildOfflineShiftSoldItems } from '../offline/buildOfflineShiftSoldItems';
import { loadFiscalContext, wrapFiscalError } from '../fiscal';
import { buildShiftPrintReport } from '../../features/cashier/utils/buildShiftPrintReport';
import { routeFor, shiftApi } from './posRouterShared';

const HTTP_NOT_FOUND = 404;
const HTTP_BAD_REQUEST = 400;

export async function posFetchCurrentShift(storeId, user, storeName = '', { catalogKind } = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local' && user?.id) {
    const local = await offlineGetCurrentShift({ storeId, cashierId: user.id });
    return local?.status === 'OPEN' ? local : null;
  }
  const apiClient = shiftApi(catalogKind);
  try {
    const res = await apiClient.current(storeId);
    const shift = res.data;
    if (!shift || shift.status !== 'OPEN') {
      if (isDesktopOfflineBridge() && user?.id) {
        try {
          await offlineCloseShift({ storeId, cashierId: user.id });
        } catch {
          /* ignore */
        }
      }
      return null;
    }
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
    return shift;
  } catch (e) {
    if (e.response?.status === HTTP_NOT_FOUND) {
      if (isDesktopOfflineBridge() && user?.id) {
        try {
          await offlineCloseShift({ storeId, cashierId: user.id });
        } catch {
          /* ignore */
        }
      }
      return null;
    }
    if (isApiUnreachableError(e) && routeFor(storeId).canFallback && user?.id) {
      const local = await offlineGetCurrentShift({ storeId, cashierId: user.id });
      return local?.status === 'OPEN' ? local : null;
    }
    throw e;
  }
}

export async function posCloseShift(storeId, user, shift, storeName = '', { catalogKind } = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local') {
    if (!shift) throw new Error('NO_OPEN_SHIFT');
    const closed = await offlineCloseShift({ storeId, cashierId: user?.id, shiftId: shift.id });
    if (!closed) throw new Error('OFFLINE_SHIFT_CLOSE_FAILED');
    return closed;
  }
  const apiClient = shiftApi(catalogKind);
  try {
    try {
      const fiscal = await loadFiscalContext(storeId, shift?.cashRegisterId);
      if (fiscal.capabilities.enabled) {
        await fiscal.provider.closeShift({
          capabilities: fiscal.capabilities,
          shiftId: shift?.id,
          cashierName: user?.fullName || user?.name || 'CASHIER',
          contractorName: storeName,
        });
      }
    } catch (err) {
      throw wrapFiscalError(err);
    }
    const res = await apiClient.close(storeId);
    if (user?.id && isDesktopOfflineBridge()) {
      try {
        await offlineCloseShift({ storeId, cashierId: user.id, shiftId: shift?.id });
      } catch {
        /* ignore */
      }
    }
    return res.data;
  } catch (err) {
    if (isApiUnreachableError(err) && routeFor(storeId).canFallback && user?.id) {
      const closed = await offlineCloseShift({ storeId, cashierId: user.id, shiftId: shift?.id });
      if (!closed) throw new Error('OFFLINE_SHIFT_CLOSE_FAILED');
      return closed;
    }
    throw err;
  }
}

export async function posXReport(storeId, shift, { catalogKind, t } = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local') {
    const soldItems = await buildOfflineShiftSoldItems(shift?.id);
    const mySales = await offlineListMySales({ shiftId: shift?.id, limit: 500 });
    const shiftWithStats = {
      ...shift,
      totalSalesAmount: mySales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0),
      salesCount: mySales.length,
      cashAmount: mySales.filter((s) => s.paymentMethod === 'CASH').reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0),
      cardAmount: mySales.filter((s) => s.paymentMethod === 'CARD').reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0),
    };
    return buildShiftPrintReport({ shift: shiftWithStats, soldItems, reportType: 'X', t });
  }
  const apiClient = shiftApi(catalogKind);
  const res = await apiClient.xReport(storeId);
  return res.data;
}
