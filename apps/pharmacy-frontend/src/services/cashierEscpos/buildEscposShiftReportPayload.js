/**
 * Payload X/Z отчёта смены для ESC/POS.
 */
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { getReceiptTranslator, RECEIPT_LOCALE } from '../../utils/receiptI18n';

/**
 * @param {Function} [t]
 */
export function buildEscposShiftReportLabels(t) {
  const tr = getReceiptTranslator();
  return {
    xReportTitle: tr('pos.xReport'),
    zReportTitle: tr('pos.zReport'),
    openedAt: tr('zReports.openedAt'),
    reportAt: tr('pos.reportAt'),
    cashier: tr('users.roleCashier'),
    phoneLabel: tr('fiscalReceipt.phoneLabel'),
    stir: tr('fiscalReceipt.stir'),
    shiftSales: tr('pos.shiftSales'),
    shiftTotal: tr('pos.shiftTotal'),
    shiftCash: tr('pos.shiftCash'),
    shiftCard: tr('pos.shiftCard'),
    shiftHumo: tr('pos.shiftHumo'),
    shiftUzcard: tr('pos.shiftUzcard'),
    shiftCashless: tr('pos.shiftCashless'),
    shiftVat: tr('pos.shiftVat'),
    lineDiscountsSum: tr('fiscalReceipt.lineDiscountsSum'),
    orderDiscountSum: tr('fiscalReceipt.orderDiscountSum'),
    discountsSum: tr('fiscalReceipt.discountsSum'),
    sectionReturn: tr('zReports.sectionReturn'),
    returnTotal: tr('zReports.sectionReturn'),
    returnCash: tr('zReports.returnCash'),
    returnCard: tr('zReports.returnCard'),
    returnHumo: tr('zReports.returnHumo'),
    returnUzcard: tr('zReports.returnUzcard'),
    returnCashless: tr('zReports.returnCashless'),
    returnVat: tr('zReports.returnVat'),
    returnCount: tr('zReports.returnCount'),
    currency: tr('fiscalReceipt.currency'),
  };
}

function readReceiptFields() {
  const { receiptFields } = useTenantDisplayStore.getState().committed;
  const out = {};
  for (const [key, on] of Object.entries(receiptFields || {})) {
    out[key] = Boolean(on);
  }
  return out;
}

/**
 * Шапка X/Z из настроек принтера (не systemAppName).
 */
function readShiftReportBranding(storeNameFallback) {
  const d = useTenantDisplayStore.getState().committed;
  const companyName =
    String(d.receiptCompanyName || '').trim() ||
    String(storeNameFallback || '').trim() ||
    APP_NAME;
  return {
    companyName,
    companyAddress: String(d.receiptCompanyAddress || '').trim(),
    companyPhone: String(d.receiptCompanyPhone || '').trim(),
    stir: String(d.receiptStir || '').trim(),
    logoDataUrl: d.receiptLogoDataUrl || null,
    logoMaxHeightMm: d.receiptLogoMaxHeightMm || null,
    // old desktop builders read branding.appName
    appName: companyName,
  };
}

/**
 * @param {object} report
 * @param {Function} t
 */
export function buildEscposShiftReportPayload(report, t) {
  if (!report) return null;
  return {
    report,
    labels: buildEscposShiftReportLabels(t),
    locale: RECEIPT_LOCALE,
    branding: readShiftReportBranding(report.storeName),
    receiptFields: readReceiptFields(),
  };
}
