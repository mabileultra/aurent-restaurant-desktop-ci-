/**
 * Payload Z-отчёта для ESC/POS.
 */
import { APP_NAME } from '../../config/brand';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';
import { getReceiptTranslator, RECEIPT_LOCALE } from '../../utils/receiptI18n';

/**
 * @param {Function} [t]
 */
export function buildEscposZReportLabels(t) {
  const tr = getReceiptTranslator();
  return {
    zReportTitle: tr('pos.zReport'),
    terminalSerial: tr('zReports.printTerminalSerial'),
    appletVer: tr('zReports.printAppletVer'),
    employee: tr('zReports.printEmployee'),
    storeName: tr('zReports.printStoreName'),
    fiscalCard: tr('cashRegisters.colFiscal'),
    zNumber: tr('zReports.printZNumber'),
    phoneLabel: tr('fiscalReceipt.phoneLabel'),
    stir: tr('fiscalReceipt.stir'),
    sectionSale: tr('zReports.sectionSale'),
    saleCash: tr('zReports.saleCash'),
    saleCard: tr('zReports.saleCard'),
    saleHumo: tr('zReports.saleHumo'),
    saleUzcard: tr('zReports.saleUzcard'),
    saleCashless: tr('zReports.saleCashless'),
    saleVat: tr('zReports.saleVat'),
    saleCount: tr('zReports.saleCount'),
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
    openedAt: tr('zReports.openedAt'),
    closedAt: tr('zReports.closedAt'),
    firstReceipt: tr('zReports.firstReceipt'),
    lastReceipt: tr('zReports.lastReceipt'),
    grandTotal: tr('zReports.grandTotal'),
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
    locale: RECEIPT_LOCALE,
    branding,
    receiptFields: readReceiptFields(),
  };
}
