/**
 * Payload Z-отчёта для ESC/POS.
 */
import i18n from '../../i18n/config';
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

/**
 * @param {Function} t
 */
export function buildEscposZReportLabels(t) {
  return {
    zReportTitle: t('pos.zReport'),
    terminalSerial: t('zReports.printTerminalSerial'),
    appletVer: t('zReports.printAppletVer'),
    employee: t('zReports.printEmployee'),
    storeName: t('zReports.printStoreName'),
    fiscalCard: t('cashRegisters.colFiscal'),
    zNumber: t('zReports.printZNumber'),
    phoneLabel: t('fiscalReceipt.phoneLabel'),
    stir: t('fiscalReceipt.stir'),
    sectionSale: t('zReports.sectionSale'),
    saleCash: t('zReports.saleCash'),
    saleCard: t('zReports.saleCard'),
    saleHumo: t('zReports.saleHumo'),
    saleUzcard: t('zReports.saleUzcard'),
    saleCashless: t('zReports.saleCashless'),
    saleVat: t('zReports.saleVat'),
    saleCount: t('zReports.saleCount'),
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
    openedAt: t('zReports.openedAt'),
    closedAt: t('zReports.closedAt'),
    firstReceipt: t('zReports.firstReceipt'),
    lastReceipt: t('zReports.lastReceipt'),
    grandTotal: t('zReports.grandTotal'),
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

function readZReportBranding(z) {
  const d = useTenantDisplayStore.getState().committed;
  const companyName =
    String(d.receiptCompanyName || '').trim() ||
    String(z?.companyName || '').trim() ||
    String(z?.storeName || '').trim() ||
    APP_NAME;
  return {
    companyName,
    companyAddress:
      String(d.receiptCompanyAddress || '').trim() ||
      String(z?.companyAddress || '').trim(),
    companyPhone: String(d.receiptCompanyPhone || '').trim(),
    stir: String(d.receiptStir || '').trim() || String(z?.tin || '').trim(),
    logoDataUrl: d.receiptLogoDataUrl || null,
    appName: companyName,
  };
}

/**
 * @param {object} z
 * @param {Function} t
 */
export function buildEscposZReportPayload(z, t) {
  if (!z) return null;
  const branding = readZReportBranding(z);
  return {
    z: {
      ...z,
      // Prefer live printer settings over stale DB brand (e.g. legacy "Tinda")
      brandName: branding.companyName,
      companyName: branding.companyName,
      companyAddress: branding.companyAddress || z.companyAddress,
      tin: branding.stir || z.tin,
    },
    labels: buildEscposZReportLabels(t),
    locale: String(i18n.language || 'ru').split('-')[0],
    branding,
    receiptFields: readReceiptFields(),
  };
}
