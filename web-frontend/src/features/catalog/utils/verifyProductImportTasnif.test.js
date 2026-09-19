import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../api', () => ({
  tasnifApi: {
    lookup: vi.fn(),
    search: vi.fn(),
    detail: vi.fn(),
  },
}));

import { tasnifApi } from '../../../api';
import { verifyProductImportRowsTasnif } from './verifyProductImportTasnif';

describe('verifyProductImportRowsTasnif', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('приоритет: штрихкод → lookup, не идём в имя', async () => {
    tasnifApi.lookup.mockResolvedValue({
      data: {
        mxik: '12345678901234567',
        name: 'Молоко',
        barcode: '4780011111111',
        markedProduct: true,
        packages: [{ code: '1546940' }],
      },
    });
    const byRow = await verifyProductImportRowsTasnif([
      { rowNum: 1, status: 'NEW', barcode: '4780011111111', name: 'Молоко' },
    ]);
    expect(byRow[1].status).toBe('found');
    expect(byRow[1].matchSource).toBe('barcode');
    expect(byRow[1].markedProduct).toBe(true);
    expect(tasnifApi.search).not.toHaveBeenCalled();
  });

  it('нет штрихкода → по имени; штрихкод из тасниф подставляется', async () => {
    tasnifApi.search.mockResolvedValue({
      data: { items: [{ mxik: '999', name: 'Сахар' }] },
    });
    tasnifApi.detail.mockResolvedValue({
      data: {
        mxik: '999',
        name: 'Сахар',
        barcode: '4600999888777',
        markedProduct: false,
        packages: [],
      },
    });
    const byRow = await verifyProductImportRowsTasnif([
      { rowNum: 2, status: 'NEW', barcode: '', name: 'Сахар' },
    ]);
    expect(byRow[2].status).toBe('found');
    expect(byRow[2].matchSource).toBe('name');
    expect(byRow[2].barcode).toBe('4600999888777');
  });

  it('нет штрихкода, есть ИКПУ → lookup по ikpu', async () => {
    tasnifApi.lookup.mockResolvedValue({
      data: { mxik: '111', name: 'Соль', barcode: '111', markedProduct: true },
    });
    const byRow = await verifyProductImportRowsTasnif([
      { rowNum: 3, status: 'NEW', barcode: '', ikpu: '111', name: 'Соль' },
    ]);
    expect(byRow[3].matchSource).toBe('ikpu');
    expect(byRow[3].status).toBe('found');
    expect(tasnifApi.lookup).toHaveBeenCalledWith(
      expect.objectContaining({ ikpu: '111' })
    );
  });

  it('дубликаты не проверяем в тасниф (idle)', async () => {
    const byRow = await verifyProductImportRowsTasnif([
      { rowNum: 4, status: 'DUPLICATE', name: 'Уже есть' },
    ]);
    expect(byRow[4].status).toBe('idle');
    expect(tasnifApi.lookup).not.toHaveBeenCalled();
    expect(tasnifApi.search).not.toHaveBeenCalled();
  });

  it('ничего не нашли → missing', async () => {
    tasnifApi.search.mockResolvedValue({ data: { items: [] } });
    const byRow = await verifyProductImportRowsTasnif([
      { rowNum: 5, status: 'NEW', name: 'Неизвестный товар' },
    ]);
    expect(byRow[5].status).toBe('missing');
  });
});
