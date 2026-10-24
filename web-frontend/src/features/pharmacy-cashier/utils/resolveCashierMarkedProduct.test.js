import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../api/pharmacyIntegration.api', () => ({
  pharmacyIntegrationApi: { verifyMarking: vi.fn() },
}));
vi.mock('../../../api/pharmacySales.api', () => ({
  pharmacySalesApi: { checkMarkSold: vi.fn() },
}));
vi.mock('../../../api/pharmacyStockMarks.api', () => ({
  pharmacyStockMarksApi: { check: vi.fn() },
}));
vi.mock('../../../api/pharmacyWarehouse.api', () => ({
  pharmacyWarehouseApi: { getProduct: vi.fn(), getByBarcode: vi.fn(), listProducts: vi.fn() },
}));

vi.mock('../../../api/tasnif.api', () => ({
  tasnifApi: { lookup: vi.fn(async () => ({ data: null })) },
}));

import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { pharmacySalesApi } from '../../../api/pharmacySales.api';
import { pharmacyStockMarksApi } from '../../../api/pharmacyStockMarks.api';
import { pharmacyWarehouseApi } from '../../../api/pharmacyWarehouse.api';
import { tasnifApi } from '../../../api/tasnif.api';
import { clearSoldMarks } from '../../marking';
import { resolveCashierMarkedProduct } from './resolveCashierMarkedProduct';

const MARK = '010478001234567821SERIAL123\u001d91CRYPT';
const product = { id: 'p1', barcode: '4780012345678', name: 'Test' };

describe('resolveCashierMarkedProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSoldMarks(7);
    clearSoldMarks(9);
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: false } });
    pharmacyStockMarksApi.check.mockResolvedValue({ data: { found: false } });
    pharmacyWarehouseApi.listProducts.mockResolvedValue({ data: { content: [] } });
    pharmacyWarehouseApi.getByBarcode.mockRejectedValue({ response: { status: 404 } });
  });

  it('resolves from stock_marks only after the sold journal is clear', async () => {
    pharmacyStockMarksApi.check.mockResolvedValue({
      data: {
        found: true,
        alreadySold: false,
        status: 'IN_STOCK',
        productId: 'p1',
      },
    });

    const result = await resolveCashierMarkedProduct({
      products: [product],
      rawCode: MARK,
      storeId: 7,
      aslEnabled: false,
    });

    expect(result.status).toBe('ok');
    expect(result.product.id).toBe('p1');
    expect(result.product.productMark).toContain('0104780012345678');
    expect(pharmacySalesApi.checkMarkSold).toHaveBeenCalled();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('blocks a code that is still IN_STOCK but already in the sales journal', async () => {
    pharmacyStockMarksApi.check.mockResolvedValue({
      data: {
        found: true,
        alreadySold: false,
        status: 'IN_STOCK',
        productId: 'p1',
      },
    });
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });

    const result = await resolveCashierMarkedProduct({
      products: [product],
      rawCode: MARK,
      storeId: 7,
      aslEnabled: true,
    });

    expect(result.status).toBe('sold');
    expect(result.product).toBeNull();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('blocks a catalog product when ASL says the code is already punched', async () => {
    pharmacyIntegrationApi.verifyMarking.mockResolvedValue({
      data: { found: true, alreadySold: true, status: 'WITHDRAWN' },
    });

    const result = await resolveCashierMarkedProduct({
      products: [product],
      rawCode: MARK,
      storeId: 7,
      aslEnabled: true,
    });

    expect(result.status).toBe('sold');
    expect(result.product).toBeNull();
    expect(pharmacyIntegrationApi.verifyMarking).toHaveBeenCalledTimes(1);
  });

  it('adds a catalog product when the code was not punched', async () => {
    const result = await resolveCashierMarkedProduct({
      products: [product],
      rawCode: MARK,
      storeId: 7,
      aslEnabled: false,
    });

    expect(result.status).toBe('ok');
    expect(result.product.id).toBe('p1');
    expect(pharmacySalesApi.checkMarkSold).toHaveBeenCalled();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('blocks a locally sold mark without ASL', async () => {
    pharmacyStockMarksApi.check.mockResolvedValue({ data: { found: false } });
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });

    const result = await resolveCashierMarkedProduct({
      products: [product],
      rawCode: MARK,
      storeId: 7,
      aslEnabled: true,
    });

    expect(result.status).toBe('sold');
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('does not resolve a card from ASL gtin — identity is Tasnif/OFD', async () => {
    pharmacyIntegrationApi.verifyMarking.mockResolvedValue({
      data: { found: true, alreadySold: false, gtin: '99900000000007' },
    });
    pharmacyWarehouseApi.getByBarcode.mockImplementation(async (barcode) => {
      if (String(barcode).includes('99900000000007')) {
        return { data: { id: 'p-asl', barcode: '99900000000007', name: 'From ASL' } };
      }
      return { data: null };
    });

    const result = await resolveCashierMarkedProduct({
      products: [],
      rawCode: MARK,
      storeId: 9,
      aslEnabled: true,
    });

    expect(result.status).toBe('not-found');
    expect(result.product).toBeNull();
    expect(pharmacyIntegrationApi.verifyMarking).toHaveBeenCalledTimes(1);
  });

  it('finds the card by Tasnif IKPU without ASL', async () => {
    tasnifApi.lookup.mockResolvedValue({ data: { mxik: '03004409005039001' } });
    pharmacyWarehouseApi.listProducts.mockImplementation(async (params) => {
      if (String(params.search) === '03004409005039001') {
        return {
          data: { content: [{ id: 'p-ofd', barcode: '999', ikpu: '03004409005039001', name: 'From OFD' }] },
        };
      }
      return { data: { content: [] } };
    });

    const result = await resolveCashierMarkedProduct({
      products: [],
      rawCode: MARK,
      storeId: 9,
      aslEnabled: false,
    });

    expect(result.status).toBe('ok');
    expect(result.product.id).toBe('p-ofd');
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('blocks already sold stock marks', async () => {
    pharmacyStockMarksApi.check.mockResolvedValue({
      data: { found: false, alreadySold: true, status: 'PENDING_WITHDRAW', productId: 'p1' },
    });

    const result = await resolveCashierMarkedProduct({
      products: [product],
      rawCode: MARK,
      storeId: 7,
    });

    expect(result.status).toBe('sold');
  });
});
