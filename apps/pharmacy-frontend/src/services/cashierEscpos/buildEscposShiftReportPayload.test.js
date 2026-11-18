import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/config';
import {
  buildEscposShiftReportLabels,
  buildEscposShiftReportPayload,
} from './buildEscposShiftReportPayload';

const MOCK_SHIFT = {
  reportType: 'X',
  storeName: 'Aurent Apteka',
  cashierName: 'Ali Valiyev',
  saleCount: 15,
  totalAmount: 350000,
  cashTotal: 200000,
  cardTotal: 150000,
};

describe('buildEscposShiftReportPayload (pharmacy-frontend)', () => {
  it('returns null when report is falsy', () => {
    expect(buildEscposShiftReportPayload(null)).toBeNull();
  });

  it('builds shift report payload with strictly Uzbek locale and labels', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const payload = buildEscposShiftReportPayload(MOCK_SHIFT);
    expect(payload.locale).toBe('uz');
    expect(payload.labels.xReportTitle).toBe('X-hisobot');
    expect(payload.labels.zReportTitle).toBe('Z-hisobot');
    expect(payload.labels.shiftSales).toBe('Sotuvlar');
    expect(payload.labels.shiftCash).toBe('Naqd');
    expect(payload.labels.stir).toBe('STIR');
  });

  it('buildEscposShiftReportLabels returns Uzbek labels directly', () => {
    const labels = buildEscposShiftReportLabels();
    expect(labels.xReportTitle).toBe('X-hisobot');
    expect(labels.zReportTitle).toBe('Z-hisobot');
    expect(labels.shiftSales).toBe('Sotuvlar');
  });
});
