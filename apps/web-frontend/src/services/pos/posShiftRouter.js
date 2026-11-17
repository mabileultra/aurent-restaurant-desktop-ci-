import { cashierShiftApi } from '../api';
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
    // Только реально открытая смена; CLOSED/прочее не держим в кэше — иначе модалка мигает «Закрыть».
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
    if (e.response?.status === 404) {
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

export async function posCloseShift(shiftId, storeId, user, shiftHint = null, { catalogKind } = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local' && user?.id) {
    const local = await offlineGetCurrentShift({ storeId, cashierId: user.id });
    const localShiftId = local?.clientShiftId || local?.id || shiftId;
    const sales = localShiftId
      ? await offlineListMySales({ shiftId: localShiftId, limit: 10000 })
      : [];
    await offlineCloseShift({ storeId, cashierId: user.id });
    const closedAt = new Date().toISOString();
    return {
      id: shiftId,
      status: 'CLOSED',
      closedAt,
      storeName: local?.storeName,
      cashierName: local?.cashierName,
      soldItems: buildOfflineShiftSoldItems(sales, { from: local?.openedAt ?? null, to: closedAt }),
    };
  }

  const apiClient = shiftApi(catalogKind);
  let fiscal = null;
  try {
    fiscal = await loadFiscalContext(storeId, shiftHint?.cashRegisterId ?? null);
    await fiscal.provider.fiscalizeShift({
      kind: 'close',
      capabilities: fiscal.capabilities,
      shiftId,
      cashierName: user?.fullName || user?.username || shiftHint?.cashierName || 'CASHIER',
      zReportNumber: shiftHint?.zReportId,
    });
  } catch (fiscalErr) {
    throw wrapFiscalError(fiscalErr, fiscal?.provider);
  }

  const closed = await apiClient.close(shiftId).then((r) => r.data);
  if (isDesktopOfflineBridge() && user?.id) {
    try {
      await offlineCloseShift({ storeId, cashierId: user.id });
    } catch {
      /* ignore */
    }
  }
  return closed;
}

export async function posXReport(shiftId, storeId, user, shiftHint = null, { catalogKind } = {}) {
  let fiscal = null;
  try {
    fiscal = await loadFiscalContext(storeId, shiftHint?.cashRegisterId ?? null);
    await fiscal.provider.fiscalizeShift({
      kind: 'x',
      capabilities: fiscal.capabilities,
      shiftId,
      cashierName: user?.fullName || user?.username || shiftHint?.cashierName || 'CASHIER',
    });
  } catch (fiscalErr) {
    throw wrapFiscalError(fiscalErr, fiscal?.provider);
  }
  if (catalogKind === 'pharmacy') {
    // Pharmacy owns shifts; X print uses Multikassa fiscal + shift aggregates (no PosCore x-report).
    return buildShiftPrintReport(shiftHint || { storeId }, {
      reportType: 'X',
      storeName: shiftHint?.storeName || '',
      cashierName: user?.fullName || user?.username || shiftHint?.cashierName || '',
      reportAt: new Date().toISOString(),
    });
  }
  return cashierShiftApi.xReport(shiftId).then((r) => r.data);
}
