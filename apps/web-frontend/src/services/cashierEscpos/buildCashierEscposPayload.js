/**
 * Собирает JSON для main process (подписи с i18n, поля из tenant store).
 */
import {
  extractCardReceiptDetails,
  getLicenseNumber,
  getReceiptVersionRows,
  normalizeCardCategory,
  resolveSalePrescriptionNumber,
  shouldPrintFiscalQr,
} from '@aurent/shared-fiscal';
import { APP_NAME } from '../../config/brand';
import { getReceiptTranslator, RECEIPT_LOCALE } from '../../utils/receiptI18n';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { usePrintSettingsStore } from '../../store/printSettingsStore';
import { resolveFiscalReceiptTypeLabel } from '../../utils/fiscalReceiptFormat';
import {
  resolveFiscalReceiptMeta,
  resolveReceiptPaymentAmounts,
} from '../../utils/resolveFiscalReceiptMeta';
import { resolveReceiptShiftLabel } from '../../utils/resolveReceiptShiftLabel';
import { cardCategoryLabel, cardTypeLabel } from '../../utils/salePaymentLabel';

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
  // Keep {{rate}} literal so escpos-sale-builder can interpolate per line / total.
  const vatRateToken = '{{rate}}';
  return {
    phoneLabel: t('fiscalReceipt.phoneLabel'),
    stir: t('fiscalReceipt.stir'),
    date: t('fiscalReceipt.date'),
    time: t('fiscalReceipt.time'),
    receiptNoShort: t('fiscalReceipt.receiptNoShort'),
    employee: t('fiscalReceipt.employee'),
    shift: t('fiscalReceipt.shift'),
    item: t('receipt.item'),
    qtyShort: t('receipt.qtyShort'),
    lineTotalShort: t('receipt.lineTotalShort'),
    ikpuLine: t('receipt.ikpuLine'),
    committentTin: t('receipt.committentTin', 'Komitent (STIR)'),
    committentPinfl: t('receipt.committentPinfl', 'Komitent (JShShIR)'),
    vatLineShort: t('fiscalReceipt.vatLineShort', { rate: vatRateToken }),
    currency: t('fiscalReceipt.currency'),
    lineDiscountsSum: t('fiscalReceipt.lineDiscountsSum'),
    orderDiscountSum: t('fiscalReceipt.orderDiscountSum'),
    discountsSum: t('fiscalReceipt.discountsSum'),
    grandTotal: t('fiscalReceipt.grandTotal'),
    vatTotalLine: t('fiscalReceipt.vatTotalLine', { rate: vatRateToken }),
    paymentForm: t('fiscalReceipt.paymentForm'),
    cash: t('fiscalReceipt.cash'),
    plastic: t('fiscalReceipt.plastic'),
    cardType: t('fiscalReceipt.cardType'),
    cardRrn: t('fiscalReceipt.cardRrn'),
    socialCardNumber: t('fiscalReceipt.socialCardNumber'),
    prescriptionNumber: t('fiscalReceipt.prescriptionNumber'),
    change: t('receipt.change'),
    fiscalSection: t('fiscalReceipt.fiscalSection'),
    virtualRegister: t('fiscalReceipt.virtualRegister'),
    fmNumber: t('fiscalReceipt.fmNumber'),
    appVersion: t('fiscalReceipt.appVersion'),
    desktopVersion: t('fiscalReceipt.desktopVersion'),
    licenseNumber: t('fiscalReceipt.licenseNumber'),
    fiscalReceiptNo: t('fiscalReceipt.fiscalReceiptNo'),
    fiscalSign: t('fiscalReceipt.fiscalSign'),
    footer: t('fiscalReceipt.footer'),
    qrHint: '',
    receiptType: t('fiscalReceipt.receiptType'),
    receiptTypeSale: t('fiscalReceipt.receiptTypeSale'),
    receiptTypeReturn: t('fiscalReceipt.receiptTypeReturn'),
    receiptTypeAdvance: t('pos.receiptType.ADVANCE'),
    receiptTypeCredit: t('pos.receiptType.CREDIT'),
    originalReceiptNo: t('fiscalReceipt.originalReceiptNo'),
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

  const printSettings = usePrintSettingsStore.getState();
  const translator = getReceiptTranslator();
  const labels = buildEscposLabels(translator);
  const cardDetails = extractCardReceiptDetails(sale);
  const pay = resolveReceiptPaymentAmounts(sale);
  const hasCardPayment =
    Number(pay.cardAmt) > 0 || sale.paymentMethod === 'CARD' || sale.paymentMethod === 'MIXED';
  const isSocialCategory = hasCardPayment && cardDetails.cardCategory === 'SOCIAL';

  const cardProviderText = (hasCardPayment && !normalizeCardCategory(sale.cardType))
    ? cardTypeLabel(sale.cardType, translator)
    : null;
  if (cardProviderText) {
    labels.plastic = `${labels.plastic} · ${cardProviderText}`;
  }
  const cardCategoryDisplay = hasCardPayment
    ? (cardCategoryLabel(cardDetails.cardCategory, translator) || null)
    : null;

  const { appVersion, desktopVersion } = getReceiptVersionRows({
    appVersion: sale.appVersion || fiscalMeta.appVersion,
    desktopVersion: sale.desktopVersion || fiscalMeta.desktopVersion,
  });
  const licenseNumber = getLicenseNumber(sale.licenseNumber ?? fiscalMeta.licenseNumber) || '';

  return {
    sale: {
      ...sale,
      appVersion,
      desktopVersion,
      licenseNumber,
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
      receiptTypeDisplay: resolveFiscalReceiptTypeLabel(sale, translator),
    },
    branding,
    receiptFields,
    qrValue,
    appVersion,
    desktopVersion,
    licenseNumber,
    paperWmm: Number(printSettings.paperWidthMm) || 80,
    labels,
    locale: RECEIPT_LOCALE,
  };
}
