import { describe, expect, it } from 'vitest';
import ru from '../../../src/locales/ru.json';
import {
  EMPTY_RECEIPT_FILTERS,
  RECEIPT_CHANNELS,
  RECEIPT_METHODS,
  RECEIPT_STATUSES,
  breakdownLabel,
  buildDishExportBody,
  buildShiftExportBody,
  buildReceiptExportBody,
  filterDishRows,
  buildReceiptExportLabels,
  buildReceiptFilter,
  dayRangeToIso,
  receiptMethodLabel,
  receiptStatusLabel,
  staffNameById,
  toReceiptQueryParams,
} from '../../../src/restaurant/admin/utils/receiptJournal';

function lookup(key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), ru);
}

const t = (key) => lookup(key) ?? key;

describe('dayRangeToIso', () => {
  it('covers whole local days, end exclusive', () => {
    const { from, to } = dayRangeToIso('2026-10-01', '2026-10-02');
    expect(new Date(to) - new Date(from)).toBe(2 * 24 * 60 * 60 * 1000);
    expect(new Date(from).getHours()).toBe(0);
  });
});

describe('buildReceiptFilter', () => {
  const base = { fromDate: '2026-10-01', toDate: '2026-10-01' };

  it('drops empty filters', () => {
    const filter = buildReceiptFilter({ ...base, filters: EMPTY_RECEIPT_FILTERS });
    expect(Object.keys(filter).sort()).toEqual(['from', 'to']);
  });

  it('maps every filter and trims search', () => {
    const filter = buildReceiptFilter({
      ...base,
      filters: {
        search: '  T1 ',
        method: 'CARD',
        status: 'PARTIAL_REFUND',
        waiterUserId: 'w-1',
        hallId: '7',
        channel: 'TAKEAWAY',
      },
    });
    expect(filter).toMatchObject({
      methods: ['CARD'],
      status: 'PARTIAL_REFUND',
      waiterUserId: 'w-1',
      hallId: 7,
      channel: 'TAKEAWAY',
      search: 'T1',
    });
  });

  it('debts preset limits to credit and advance unless a method is picked', () => {
    expect(buildReceiptFilter({ ...base, preset: 'debts' }).methods).toEqual(['CREDIT', 'ADVANCE']);
    expect(buildReceiptFilter({
      ...base,
      preset: 'debts',
      filters: { ...EMPTY_RECEIPT_FILTERS, method: 'ADVANCE' },
    }).methods).toEqual(['ADVANCE']);
  });
});

describe('toReceiptQueryParams', () => {
  it('joins methods with commas for Spring list binding', () => {
    const params = toReceiptQueryParams({ from: 'a', to: 'b', methods: ['CREDIT', 'ADVANCE'] }, 2, 20);
    expect(params).toEqual({ from: 'a', to: 'b', methods: 'CREDIT,ADVANCE', page: 2, size: 20 });
  });

  it('does not mutate the shared filter', () => {
    const filter = { from: 'a', to: 'b', methods: ['CASH'] };
    toReceiptQueryParams(filter, 0, 10);
    expect(filter.methods).toEqual(['CASH']);
  });
});

describe('labels', () => {
  it('every method, status and channel has a ru translation', () => {
    for (const m of RECEIPT_METHODS) expect(receiptMethodLabel(m, t)).not.toMatch(/^rst\./);
    for (const s of RECEIPT_STATUSES) expect(receiptStatusLabel(s, t)).not.toMatch(/^rst\./);
    for (const c of RECEIPT_CHANNELS) expect(t(`rst.reports.journal.channel${c}`)).not.toMatch(/^rst\./);
  });

  it('export labels are all translated', () => {
    const labels = buildReceiptExportLabels(t);
    const untranslated = Object.entries(labels).filter(([, v]) => String(v).startsWith('rst.'));
    expect(untranslated).toEqual([]);
    expect(labels['col.orderNo']).toBe(ru.rst.reports.checkNo);
    expect(labels['status.REFUNDED']).toBe(ru.rst.reports.journal.statusREFUNDED);
    expect(labels['method.CASH']).toBe(ru.rst.reports.methodCash);
  });
});

describe('breakdownLabel', () => {
  it('labels every breakdown group', () => {
    expect(breakdownLabel('method', 'CARD', t)).toBe(ru.rst.reports.methodCard);
    expect(breakdownLabel('channel', 'DELIVERY', t)).toBe(ru.rst.reports.journal.channelDELIVERY);
    expect(breakdownLabel('hall', null, t)).toBe(ru.rst.reports.summary.noHall);
    expect(breakdownLabel('hall', 'Терраса', t)).toBe('Терраса');
    expect(breakdownLabel('hour', '09', t)).toBe('09:00–10:00');
    expect(breakdownLabel('hour', '23', t)).toBe('23:00–00:00');
    expect(breakdownLabel('day', '2026-10-02', t)).toBe('02.10.2026');
    expect(breakdownLabel('card', 'HUMO', t)).toBe('HUMO');
  });
});

describe('filterDishRows', () => {
  const rows = [
    { name: 'Плов', category: 'Горячее' },
    { name: 'Чай', category: 'Напитки' },
  ];

  it('matches dish name or category, case-insensitive', () => {
    expect(filterDishRows(rows, 'плов')).toEqual([rows[0]]);
    expect(filterDishRows(rows, 'НАПИТ')).toEqual([rows[1]]);
    expect(filterDishRows(rows, '  ')).toEqual(rows);
    expect(filterDishRows(undefined, 'x')).toEqual([]);
  });
});

describe('buildDishExportBody', () => {
  it('sends translated dish columns', () => {
    const body = buildDishExportBody({ from: 'a', to: 'b' }, { t, timeZone: 'UTC' });
    expect(body.labels.title).toBe(ru.rst.reports.dishes.title);
    expect(body.labels['col.name']).toBe(ru.rst.reports.dish);
    const untranslated = Object.values(body.labels).filter((v) => String(v).startsWith('rst.'));
    expect(untranslated).toEqual([]);
  });
});

describe('buildShiftExportBody', () => {
  it('sends translated shift columns and staff names', () => {
    const body = buildShiftExportBody({ from: 'a', to: 'b' }, {
      userNameById: new Map([['u1', 'Азиз']]),
      t,
      timeZone: 'Asia/Tashkent',
    });
    expect(body.userNames).toEqual({ u1: 'Азиз' });
    expect(body.labels.title).toBe(ru.rst.reports.shifts.title);
    const untranslated = Object.values(body.labels).filter((v) => String(v).startsWith('rst.'));
    expect(untranslated).toEqual([]);
  });
});

describe('buildReceiptExportBody', () => {
  it('sends filter, staff names, labels and time zone', () => {
    const names = staffNameById([
      { id: 'u1', fullName: 'Азиз' },
      { id: 'u2', username: 'kassa' },
      { id: null, fullName: 'skip' },
    ]);
    const body = buildReceiptExportBody({ from: 'a', to: 'b' }, { userNameById: names, t, timeZone: 'Asia/Tashkent' });
    expect(body.filter).toEqual({ from: 'a', to: 'b' });
    expect(body.userNames).toEqual({ u1: 'Азиз', u2: 'kassa' });
    expect(body.timeZone).toBe('Asia/Tashkent');
    expect(body.labels.title).toBe(ru.rst.reports.journal.title);
  });

  it('falls back to the browser time zone', () => {
    const body = buildReceiptExportBody({ from: 'a', to: 'b' }, { userNameById: new Map(), t });
    expect(body.timeZone).toBeTruthy();
  });
});
