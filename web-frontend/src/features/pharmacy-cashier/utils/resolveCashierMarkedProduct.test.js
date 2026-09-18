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
  pharmacyWarehouseApi: { getProduct: vi.fn(), getByBarcode: vi.fn() },
}));

import { pharmacySalesApi } from '../../../api/pharmacySales.api';
import { pharmacyStockMarksApi } from '../../../api/pharmacyStockMarks.api';
import { resolveCashierMarkedProduct } from './resolveCashierMarkedProduct';

const MARK = '010478001234567821SERIAL123\u001d91CRYPT';
const product = { id: 'p1', barcode: '4780012345678', name: 'Test' };

describe('resolveCashierMarkedProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves from stock_marks without ASL', async () => {
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
      aslEnabled: true,
    });

    expect(result.status).toBe('ok');
    expect(result.product.id).toBe('p1');
    expect(result.product.productMark).toContain('0104780012345678');
    expect(pharmacySalesApi.checkMarkSold).not.toHaveBeenCalled();
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
