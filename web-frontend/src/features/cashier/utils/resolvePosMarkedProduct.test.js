import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../api/pharmacyIntegration.api', () => ({
  pharmacyIntegrationApi: {
    verifyMarking: vi.fn(),
  },
}));

vi.mock('../../../services/pos/posDataRouter', () => ({
  posFetchProductByBarcode: vi.fn(),
}));

import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { posFetchProductByBarcode } from '../../../services/pos/posDataRouter';
import { resolvePosMarkedProduct } from './resolvePosMarkedProduct';

const KM = '010478001234567821AbCdEfGhIj';
const EAN = '4780012345678';
const product = { id: 11, barcode: EAN, name: 'Чай', markedProduct: true };

describe('resolvePosMarkedProduct — путь только для КМ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('обычный штрихкод не идёт в маркировку и ASL не вызывается', async () => {
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: EAN,
      storeId: 7,
      aslEnabled: true,
    });
    expect(result.status).toBe('not-marking');
    expect(result.product).toBeNull();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
    expect(posFetchProductByBarcode).not.toHaveBeenCalled();
  });

  it('КМ без ASL: товар по GTIN → ok + productMarks', async () => {
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
      aslEnabled: false,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(11);
    expect(result.product.productMark).toBeTruthy();
    expect(result.product.productMarks).toHaveLength(1);
    expect(result.product.markedProduct).toBe(true);
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('КМ + ASL уже продана → sold (в чек нельзя)', async () => {
    pharmacyIntegrationApi.verifyMarking.mockResolvedValue({
      data: { found: true, alreadySold: true, status: 'SOLD' },
    });
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
      aslEnabled: true,
    });
    expect(result.status).toBe('sold');
    expect(pharmacyIntegrationApi.verifyMarking).toHaveBeenCalledWith({
      storeId: 7,
      code: expect.any(String),
    });
  });

  it('КМ + ASL ок → товар в чек', async () => {
    pharmacyIntegrationApi.verifyMarking.mockResolvedValue({
      data: { found: true, alreadySold: false, status: 'INTRODUCED', gtin: EAN },
    });
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
      aslEnabled: true,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(11);
  });

  it('КМ: товара нет → not-found', async () => {
    posFetchProductByBarcode.mockResolvedValue(null);
    const result = await resolvePosMarkedProduct({
      products: [],
      rawCode: KM,
      storeId: 7,
      aslEnabled: false,
    });
    expect(result.status).toBe('not-found');
    expect(result.product).toBeNull();
  });

  it('ASL упал по сети, но GTIN найден → ok (не блокируем продажу)', async () => {
    pharmacyIntegrationApi.verifyMarking.mockRejectedValue(new Error('network'));
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
      aslEnabled: true,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(11);
  });

  it('ASL даёт GTIN, локально товара не было → ищем по gtin из ASL', async () => {
    pharmacyIntegrationApi.verifyMarking.mockResolvedValue({
      data: { found: true, alreadySold: false, gtin: EAN },
    });
    posFetchProductByBarcode.mockImplementation(async (_storeId, barcode) => (
      String(barcode).includes('4780012345678') || barcode === EAN ? product : null
    ));
    const result = await resolvePosMarkedProduct({
      products: [],
      rawCode: KM,
      storeId: 7,
      aslEnabled: true,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(11);
  });
});
