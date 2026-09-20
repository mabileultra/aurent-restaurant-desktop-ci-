/**
 * Payload X/Z отчёта смены для ESC/POS.
 */
import i18n from '../../i18n/config';
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

/**
 * @param {Function} t
 */
export function buildEscposShiftReportLabels(t) {
  return {
    xReportTitle: t('pos.xReport'),
    zReportTitle: t('pos.zReport'),
    openedAt: t('zReports.openedAt'),
    reportAt: t('pos.reportAt'),
    cashier: t('users.roleCashier'),
    phoneLabel: t('fiscalReceipt.phoneLabel'),
    stir: t('fiscalReceipt.stir'),
    shiftSales: t('pos.shiftSales'),
    shiftTotal: t('pos.shiftTotal'),
    shiftCash: t('pos.shiftCash'),
    shiftCard: t('pos.shiftCard'),
    shiftHumo: t('pos.shiftHumo'),
    shiftUzcard: t('pos.shiftUzcard'),
    shiftCashless: t('pos.shiftCashless'),
    shiftVat: t('pos.shiftVat'),
    lineDiscountsSum: t('fiscalReceipt.lineDiscountsSum'),
    orderDiscountSum: t('fiscalReceipt.orderDiscountSum'),
    discountsSum: t('fiscalReceipt.discountsSum'),
    sectionReturn: t('zReports.sectionReturn'),
    returnTotal: t('zReports.sectionReturn'),
    returnCash: t('zReports.returnCash'),
    returnCard: t('zReports.returnCard'),
    returnHumo: t('zReports.returnHumo'),
    returnUzcard: t('zReports.returnUzcard'),
    returnCashless: t('zReports.returnCashless'),
    returnVat: t('zReports.returnVat'),
    returnCount: t('zReports.returnCount'),
    currency: t('fiscalReceipt.currency'),
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
    locale: String(i18n.language || 'ru').split('-')[0],
    branding: readShiftReportBranding(report.storeName),
    receiptFields: readReceiptFields(),
  };
}
