import { extractCardReceiptDetails, normalizeCardCategory, resolveSalePrescriptionNumber, shouldPrintFiscalQr } from '@aurent/shared-fiscal';
import { APP_NAME } from '../../../config/brand';
import { useTenantDisplayStore } from '../../../store/tenantDisplayStore';
import { resolveFiscalReceiptTypeLabel, splitDateTime } from '../../../utils/fiscalReceiptFormat';
import { cardCategoryLabel, cardTypeLabel } from '../../../utils/salePaymentLabel';
import {
  resolveFiscalReceiptMeta,
  resolveReceiptPaymentAmounts,
} from '../../../utils/resolveFiscalReceiptMeta';
import { resolveReceiptShiftLabel } from '../../../utils/resolveReceiptShiftLabel';
import { resolveVatRateLabel } from './receiptLineMath';

const CARD_PAYMENT_METHODS = ['CARD', 'MIXED'];
const SOCIAL_CARD_CATEGORY = 'SOCIAL';

/** Реквизиты компании: настройки чека арендатора → env → данные продажи. */
function resolveBranding(sale, custom) {
  const env = import.meta.env;
  return {
    logoDataUrl: custom.receiptLogoDataUrl,
    companyName: custom.receiptCompanyName || env.VITE_COMPANY_NAME || sale.storeName || APP_NAME,
    companyAddress: custom.receiptCompanyAddress || env.VITE_COMPANY_ADDRESS || '',
    companyPhone: custom.receiptCompanyPhone || env.VITE_COMPANY_PHONE || '',
    stir: custom.receiptStir || env.VITE_COMPANY_STIR || env.VITE_STIR || '',
  };
}

function resolvePaymentView(sale, t) {
  const pay = resolveReceiptPaymentAmounts(sale);
  const cardDetails = extractCardReceiptDetails(sale);
  const hasCardPayment = Number(pay.cardAmt) > 0;
  return {
    cashAmt: pay.cashAmt,
    cardAmt: pay.cardAmt,
    qrAmt: pay.qrAmt,
    paidTotal: pay.paidTotal,
    change: pay.change,
    method: pay.method,
    total: Number(sale.totalAmount) || 0,
    cardDetails,
    hasCardPayment,
    isSocialCategory: hasCardPayment && cardDetails.cardCategory === SOCIAL_CARD_CATEGORY,
    // sale.cardType хранит либо провайдера (HUMO/UZCARD), либо категорию карты — подписываем только провайдера.
    cardProviderText:
      hasCardPayment && !normalizeCardCategory(sale.cardType) ? cardTypeLabel(sale.cardType, t) : null,
    cardCategoryText: hasCardPayment ? cardCategoryLabel(cardDetails.cardCategory, t) : null,
  };
}

/**
 * Данные для секций фискального чека: всё, что вычисляется из продажи,
 * настроек чека арендатора и env. Разметка — в секциях fiscal-receipt/.
 */
export function useFiscalReceiptView(sale, t) {
  const isOn = useTenantDisplayStore((s) => s.isReceiptFieldOn);
  const receiptLogoDataUrl = useTenantDisplayStore((s) => s.committed.receiptLogoDataUrl);
  const receiptCompanyName = useTenantDisplayStore((s) => s.committed.receiptCompanyName);
  const receiptCompanyAddress = useTenantDisplayStore((s) => s.committed.receiptCompanyAddress);
  const receiptCompanyPhone = useTenantDisplayStore((s) => s.committed.receiptCompanyPhone);
  const receiptStir = useTenantDisplayStore((s) => s.committed.receiptStir);

  if (!sale) return null;

  const env = import.meta.env;
  const fiscalMeta = resolveFiscalReceiptMeta(sale, {
    fmNumber: env.VITE_FISCAL_MODULE_NUMBER || env.VITE_FISCAL_CARD_ID || '',
    virtualRegister: env.VITE_VIRTUAL_REGISTER_ID || env.VITE_REGISTER_NO || '',
  });
  const { date, time } = splitDateTime(sale.createdAt);
  const canPrintFiscalQr = sale.printFiscalQr !== false && shouldPrintFiscalQr(sale?.receiptType);

  return {
    isOn,
    branding: resolveBranding(sale, {
      receiptLogoDataUrl,
      receiptCompanyName,
      receiptCompanyAddress,
      receiptCompanyPhone,
      receiptStir,
    }),
    date,
    time,
    shiftNo: resolveReceiptShiftLabel(sale, { envShiftNo: env.VITE_SHIFT_NO }),
    payment: resolvePaymentView(sale, t),
    prescriptionNumber: resolveSalePrescriptionNumber(sale),
    vatRateLabel: resolveVatRateLabel(sale.items),
    receiptTypeLabel: resolveFiscalReceiptTypeLabel(sale, t),
    fiscalMeta,
    showQrBlock: canPrintFiscalQr && isOn('qrCode') && Boolean(fiscalMeta.qrValue),
  };
}
