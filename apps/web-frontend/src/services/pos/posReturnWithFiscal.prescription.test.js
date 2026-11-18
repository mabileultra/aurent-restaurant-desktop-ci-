import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/sale.api', () => ({ saleApi: { returnItems: vi.fn() } }));
vi.mock('../../api/pharmacySales.api', () => ({ pharmacySalesApi: { returnItems: vi.fn() } }));
vi.mock('../fiscal', () => ({
  loadFiscalContext: vi.fn(),
  wrapFiscalError: (err) => err,
}));
vi.mock('../../features/marking', () => ({ clearSoldMarks: vi.fn() }));
vi.mock('./posRouteResolver', () => ({ resolvePosRoute: vi.fn(() => ({ route: 'remote' })) }));
vi.mock('../../store/connectivityStore', () => ({
  useConnectivityStore: { getState: vi.fn(() => ({})) },
}));

import { pharmacySalesApi } from '../../api/pharmacySales.api';
import { loadFiscalContext } from '../fiscal';
import { posReturnSaleItems } from './posReturnWithFiscal';

describe('posReturnSaleItems: refund never asks for a prescription number (AUR-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadFiscalContext.mockResolvedValue({
      capabilities: { enabled: false },
      provider: { fiscalizeRefund: vi.fn().mockResolvedValue(null) },
    });
    pharmacySalesApi.returnItems.mockResolvedValue({ data: { id: 5, status: 'RETURNED' } });
  });

  it('returns a prescription drug from a sale that has no prescription number', async () => {
    const sale = {
      id: 5,
      storeId: 7,
      receiptNumber: 'PHR-0005',
      items: [{ id: 51, productId: 2, quantity: 1, requiresPrescription: true }],
    };
    const payload = { lines: [{ saleItemId: 51, quantity: 1 }] };

    const result = await posReturnSaleItems({ sale, payload, storeId: 7, catalogKind: 'pharmacy' });

    expect(pharmacySalesApi.returnItems).toHaveBeenCalledWith(5, payload);
    expect(result).toEqual({ id: 5, status: 'RETURNED' });
  });
});
