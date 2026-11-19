import { pharmacySalesApi, saleApi } from '../api';
import { isApiUnreachableError } from '../../utils/apiNetworkError';
import { resolveOnlineSaleTimeoutMs } from './posCheckoutTimeouts';
import { offlineListMySales } from '../offline/desktopOfflineBridge';
import { processOfflineCheckout } from './offlineCheckout';
import { loadFiscalContext, wrapFiscalError } from '../fiscal';
import { lineSubtotal } from '../../store/cartStore';
import { round2 } from '../../utils/taxAmounts';
import { buildPharmacySaleExtras } from '../../features/cashier/utils/buildPharmacySaleExtras';
import { assertCartMarksNotPunched } from '../../features/marking';
import {
  assertSalePrescriptionNumber,
  sanitizeCardPaymentFields,
  withCardReceiptDetails,
  withSaleCommittentDetails,
  withSalePrescriptionNumber,
} from '@aurent/shared-fiscal';
import { routeFor } from './posRouterShared';

export async function posCreateSale({
  storeId,
  payment: rawPayment,
  user,
  cachedShift,
  storeName,
  getCheckoutLineItems,
  getCheckoutOrderDiscountAmount,
  getCheckoutOrderDiscountPercent,
  items,
  catalogKind,
}) {
  const payment = sanitizeCardPaymentFields(rawPayment);
  const { route } = routeFor(storeId);
  const offline = route === 'local';
  const cartItems = items || [];
  const linesTotal = round2(cartItems.reduce((acc, item) => acc + lineSubtotal(item), 0));
  const orderDiscount = round2(
    Math.min(Math.max(0, Number(getCheckoutOrderDiscountAmount?.() || 0)), linesTotal),
  );
  const total = round2(Math.max(0, linesTotal - orderDiscount));
  const clientSaleId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `sale-${Date.now()}`;

  // До фискализации и до любого запроса: онлайн и офлайн, любой способ оплаты.
  assertSalePrescriptionNumber(cartItems, payment);
  await assertCartMarksNotPunched(storeId, cartItems);

  let fiscalPayload = null;
  let capabilities = { enabled: false, printFiscalQr: true };
  let fiscalProvider = null;
  try {
    const cashRegisterId = cachedShift?.cashRegisterId ?? null;
    const fiscal = await loadFiscalContext(storeId, cashRegisterId, {
      allowLoadFailureAsDisabled: offline,
    });
    capabilities = fiscal.capabilities;
    fiscalProvider = fiscal.provider;
    fiscalPayload = await fiscalProvider.fiscalizeSale({
      capabilities,
      cartItems,
      payment,
      total,
      shiftId: cachedShift?.id,
      cashierName: user?.fullName || user?.name || 'CASHIER',
      contractorName: storeName,
      offline,
      clientSaleId,
    });
  } catch (err) {
    throw wrapFiscalError(err, fiscalProvider);
  }

  const fiscalForApi = fiscalPayload
    ? {
        fiscalStatus: fiscalPayload.fiscalStatus,
        fiscalSign: fiscalPayload.fiscalSign,
        fiscalReceiptSeq: fiscalPayload.fiscalReceiptSeq,
        multikassaSaleId: fiscalPayload.multikassaSaleId,
        fiscalQrUrl: fiscalPayload.fiscalQrUrl,
        fiscalError: fiscalPayload.fiscalError,
        fiscalTerminalId: fiscalPayload.fiscalTerminalId || fiscalPayload.terminalId || null,
      }
    : null;

  if (offline) {
    return processOfflineCheckout({
      storeId,
      payment,
      user,
      cachedShift,
      storeName,
      getCheckoutOrderDiscountAmount,
      getCheckoutOrderDiscountPercent,
      items,
      fiscal: fiscalPayload || undefined,
      printFiscalQr: capabilities?.printFiscalQr !== false,
    });
  }

  const onlineTimeout = resolveOnlineSaleTimeoutMs();

  try {
    const pharmacyExtras = buildPharmacySaleExtras(payment);
    const salePayload = {
      storeId: Number(storeId),
      paymentMethod: payment.paymentMethod,
      receiptType: payment.receiptType,
      cardType: payment.cardType,
      cashAmount: payment.cashAmount,
      cardAmount: payment.cardAmount,
      amountTendered: payment.amountTendered,
      customerId: payment.customerId || undefined,
      advanceAmount: payment.advanceAmount || undefined,
      items: getCheckoutLineItems(),
      orderDiscountAmount: getCheckoutOrderDiscountAmount(),
      orderDiscountPercent: getCheckoutOrderDiscountPercent(),
      ...(pharmacyExtras?.notes ? { notes: pharmacyExtras.notes } : {}),
      ...(pharmacyExtras?.patientPinfl ? { patientPinfl: pharmacyExtras.patientPinfl } : {}),
      ...(pharmacyExtras?.loyaltyPhone ? { loyaltyPhone: pharmacyExtras.loyaltyPhone } : {}),
      ...(pharmacyExtras?.pharmacyDmed ? { pharmacyDmed: true } : {}),
      ...(fiscalForApi ? { fiscal: fiscalForApi } : {}),
      printFiscalQr: capabilities?.printFiscalQr !== false,
    };
    const saleClient = catalogKind === 'pharmacy' ? pharmacySalesApi : saleApi;
    const res = await saleClient.create(
      salePayload,
      onlineTimeout ? { timeout: onlineTimeout } : undefined,
    );
    return res && res.data
      ? {
          ...res,
          data: withSaleCommittentDetails(
            withSalePrescriptionNumber(withCardReceiptDetails(res.data, payment), payment),
            cartItems,
            { fiscalProvider: capabilities?.fiscalProvider },
          ),
        }
      : res;
  } catch (err) {
    if (isApiUnreachableError(err) && routeFor(storeId).canFallback) {
      return processOfflineCheckout({
        storeId,
        payment,
        user,
        cachedShift,
        storeName,
        getCheckoutOrderDiscountAmount,
        getCheckoutOrderDiscountPercent,
        items,
        fiscal: fiscalPayload || undefined,
        printFiscalQr: capabilities?.printFiscalQr !== false,
      });
    }
    throw err;
  }
}

export async function posFetchMySales(storeId, params = {}, { catalogKind } = {}) {
  const { route } = routeFor(storeId);
  if (route === 'local') {
    const rows = await offlineListMySales({ shiftId: params.shiftId, limit: params.size || 50 });
    return {
      content: rows,
      number: params.page || 0,
      totalPages: 1,
      totalElements: rows.length,
    };
  }
  try {
    const client = catalogKind === 'pharmacy' ? pharmacySalesApi : saleApi;
    return await client.mySales(params).then((r) => r.data);
  } catch (err) {
    if (isApiUnreachableError(err) && routeFor(storeId).canFallback) {
      const rows = await offlineListMySales({ shiftId: params.shiftId, limit: params.size || 50 });
      return {
        content: rows,
        number: params.page || 0,
        totalPages: 1,
        totalElements: rows.length,
      };
    }
    throw err;
  }
}
