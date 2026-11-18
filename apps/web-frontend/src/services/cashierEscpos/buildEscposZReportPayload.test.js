import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/config';
import {
  buildEscposZReportLabels,
  buildEscposZReportPayload,
} from './buildEscposZReportPayload';

const MOCK_Z = {
  zNumber: 42,
  terminalSerial: 'N5-001',
  appletVer: '1.2.3',
  employeeName: 'Ali Valiyev',
  storeName: 'Aurent Chilonzor',
  fiscalCardId: 'FC-999',
  tin: '123456789',
  cashTotal: 100000,
  cardTotal: 50000,
  totalAmount: 150000,
};

describe('buildEscposZReportPayload', () => {
  it('returns null when z is falsy', () => {
    expect(buildEscposZReportPayload(null)).toBeNull();
  });

  it('builds Z report payload with strictly Uzbek locale and labels', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const payload = buildEscposZReportPayload(MOCK_Z);
    expect(payload.locale).toBe('uz');
    expect(payload.labels.zReportTitle).toBe('Z-hisobot');
    expect(payload.labels.saleCash).toBe('Naqd hisob-kitob summasi');
    expect(payload.labels.grandTotal).toBe('Jami');
    expect(payload.labels.stir).toBe('STIR');
  });

  it('buildEscposZReportLabels returns Uzbek labels directly', () => {
    const labels = buildEscposZReportLabels();
    expect(labels.zReportTitle).toBe('Z-hisobot');
    expect(labels.saleCash).toBe('Naqd hisob-kitob summasi');
  });
});
