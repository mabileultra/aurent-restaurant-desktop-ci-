/**
 * Собирает JSON для main process (подписи с i18n, поля из tenant store).
 */
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { usePrintSettingsStore } from '../../store/printSettingsStore';
import {
  extractCardReceiptDetails,
  normalizeCardCategory,
  resolveSalePrescriptionNumber,
  shouldPrintFiscalQr,
} from '@aurent/shared-fiscal';
import { resolveFiscalReceiptTypeLabel } from '../../utils/fiscalReceiptFormat';
import {
  resolveFiscalReceiptMeta,
  resolveReceiptPaymentAmounts,
} from '../../utils/resolveFiscalReceiptMeta';
import { resolveReceiptShiftLabel } from '../../utils/resolveReceiptShiftLabel';
import { cardCategoryLabel, cardTypeLabel } from '../../utils/salePaymentLabel';
import { getReceiptTranslator, RECEIPT_LOCALE } from '../../utils/receiptI18n';

/**
 * Карта включённых полей чека из tenant store.
 * @returns {Record<string, boolean>}
 */
function readReceiptFields() {
  const { receiptFields } = useTenantDisplayStore.getState().committed;
  const out = {};
  for (const [key, on] of Object.entries(receiptFields || {})) {
    out[key] = Boolean(on);
  }
  return out;
}

/**
 * Брендинг и env для шапки чека.
 * @returns {object}
 */
function readBranding() {
  const d = useTenantDisplayStore.getState().committed;
  return {
    companyName: d.receiptCompanyName || '',
    companyAddress: d.receiptCompanyAddress || '',
    companyPhone: d.receiptCompanyPhone || '',
    stir: d.receiptStir || '',
    logoDataUrl: d.receiptLogoDataUrl || null,
    qrBase: import.meta.env.VITE_FISCAL_QR_BASE?.trim() || '',
    virtualRegister:
      import.meta.env.VITE_VIRTUAL_REGISTER_ID || import.meta.env.VITE_REGISTER_NO || '',
    fmNumber:
      import.meta.env.VITE_FISCAL_MODULE_NUMBER ||
      import.meta.env.VITE_FISCAL_CARD_ID ||
      '',
    shiftNo: import.meta.env.VITE_SHIFT_NO || '001',
  };
}

/**
 * Подписи строк чека (переводы с фронта — main без i18n).
 * Ставку НДС не подставляем здесь: electron подставляет {{rate}} из sale.items.
 * @param {Function} t — react-i18next t
 * @returns {Record<string, string>}
 */
export function buildEscposLabels(t) {
  const tr = getReceiptTranslator();
  // Keep {{rate}} literal so escpos-sale-builder can interpolate per line / total.
  const vatRateToken = '{{rate}}';
  return {
    phoneLabel: tr('fiscalReceipt.phoneLabel'),
    stir: tr('fiscalReceipt.stir'),
    date: tr('fiscalReceipt.date'),
    time: tr('fiscalReceipt.time'),
    receiptNoShort: tr('fiscalReceipt.receiptNoShort'),
    employee: tr('fiscalReceipt.employee'),
    shift: tr('fiscalReceipt.shift'),
    item: tr('receipt.item'),
    qtyShort: tr('receipt.qtyShort'),
    lineTotalShort: tr('receipt.lineTotalShort'),
    ikpuLine: tr('receipt.ikpuLine'),
    vatLineShort: tr('fiscalReceipt.vatLineShort', { rate: vatRateToken }),
    currency: tr('fiscalReceipt.currency'),
    lineDiscountsSum: tr('fiscalReceipt.lineDiscountsSum'),
    orderDiscountSum: tr('fiscalReceipt.orderDiscountSum'),
    discountsSum: tr('fiscalReceipt.discountsSum'),
    grandTotal: tr('fiscalReceipt.grandTotal'),
    vatTotalLine: tr('fiscalReceipt.vatTotalLine', { rate: vatRateToken }),
    paymentForm: tr('fiscalReceipt.paymentForm'),
    cash: tr('fiscalReceipt.cash'),
    plastic: tr('fiscalReceipt.plastic'),
    cardType: tr('fiscalReceipt.cardType'),
    cardRrn: tr('fiscalReceipt.cardRrn'),
    socialCardNumber: tr('fiscalReceipt.socialCardNumber'),
    prescriptionNumber: tr('fiscalReceipt.prescriptionNumber'),
    change: tr('receipt.change'),
    fiscalSection: tr('fiscalReceipt.fiscalSection'),
    virtualRegister: tr('fiscalReceipt.virtualRegister'),
    fmNumber: tr('fiscalReceipt.fmNumber'),
    fiscalReceiptNo: tr('fiscalReceipt.fiscalReceiptNo'),
    fiscalSign: tr('fiscalReceipt.fiscalSign'),
    footer: tr('fiscalReceipt.footer'),
    qrHint: '',
    receiptType: tr('fiscalReceipt.receiptType'),
    receiptTypeSale: tr('fiscalReceipt.receiptTypeSale'),
    receiptTypeReturn: tr('fiscalReceipt.receiptTypeReturn'),
    receiptTypeAdvance: tr('pos.receiptType.ADVANCE'),
    receiptTypeCredit: tr('pos.receiptType.CREDIT'),
    originalReceiptNo: tr('fiscalReceipt.originalReceiptNo'),
  };
}

/**
 * Полный payload для IPC desktop:print-receipt-escpos.
 * @param {object} sale — ответ POST /sales
 * @param {Function} t
 */
export function buildCashierEscposPayload(sale, t) {
  if (!sale) return null;

  const branding = readBranding();
  if (!branding.companyName) {
    branding.companyName =
      String(import.meta.env.VITE_COMPANY_NAME || '').trim() || String(sale.storeName || '').trim() || APP_NAME;
  }
  if (!branding.companyAddress) {
    branding.companyAddress = String(import.meta.env.VITE_COMPANY_ADDRESS || '').trim();
  }
  if (!String(branding.companyPhone || '').trim()) {
    branding.companyPhone = String(import.meta.env.VITE_COMPANY_PHONE || '').trim();
  }
  if (!String(branding.stir || '').trim()) {
    branding.stir =
      String(import.meta.env.VITE_COMPANY_STIR || '').trim() || String(import.meta.env.VITE_STIR || '').trim();
  }

  branding.shiftNo = resolveReceiptShiftLabel(sale, {
    envShiftNo: import.meta.env.VITE_SHIFT_NO,
  });
  // Не вырезать «001» из номера чека — это не смена.

  const fiscalMeta = resolveFiscalReceiptMeta(sale, branding);
  branding.fmNumber = fiscalMeta.fmNumber;
  branding.virtualRegister = fiscalMeta.virtualRegister;

  const canPrintQr = shouldPrintFiscalQr(sale?.receiptType);
  const printFiscalQr = sale.printFiscalQr !== false && canPrintQr;
  const qrValue = printFiscalQr ? fiscalMeta.qrValue : '';
  const receiptFields = readReceiptFields();
  receiptFields.footer = true;
  if (!printFiscalQr || !qrValue) {
    receiptFields.qrCode = false;
  }

  const tr = getReceiptTranslator();
  const printSettings = usePrintSettingsStore.getState();
  const labels = buildEscposLabels(tr);
  const cardDetails = extractCardReceiptDetails(sale);
  const pay = resolveReceiptPaymentAmounts(sale);
  const hasCardPayment =
    Number(pay.cardAmt) > 0 || sale.paymentMethod === 'CARD' || sale.paymentMethod === 'MIXED';
  const isSocialCategory = hasCardPayment && cardDetails.cardCategory === 'SOCIAL';

  const cardProviderText = (hasCardPayment && !normalizeCardCategory(sale.cardType))
    ? cardTypeLabel(sale.cardType, tr)
    : null;
  if (cardProviderText) {
    labels.plastic = `${labels.plastic} · ${cardProviderText}`;
  }
  const cardCategoryDisplay = hasCardPayment
    ? (cardCategoryLabel(cardDetails.cardCategory, tr) || null)
    : null;

  return {
    sale: {
      ...sale,
      cardCategory: hasCardPayment ? cardDetails.cardCategory : null,
      cardCategoryDisplay,
      socialCardNumber: isSocialCategory ? cardDetails.socialCardNumber : null,
      rrn: hasCardPayment ? cardDetails.rrn : null,
      prescriptionNumber: resolveSalePrescriptionNumber(sale),
      printFiscalQr,
      fiscalQrUrl: qrValue || null,
      fiscalReceiptSeq: sale.fiscalReceiptSeq || fiscalMeta.fiscalReceiptNo || null,
      fiscalTerminalId: sale.fiscalTerminalId || fiscalMeta.fmNumber || null,
      fiscalSign: sale.fiscalSign || fiscalMeta.fiscalSign || null,
      receiptTypeDisplay: resolveFiscalReceiptTypeLabel(sale, tr),
    },
    branding,
    receiptFields,
    qrValue,
    paperWmm: Number(printSettings.paperWidthMm) || 80,
    labels,
    locale: RECEIPT_LOCALE,
  };
}
