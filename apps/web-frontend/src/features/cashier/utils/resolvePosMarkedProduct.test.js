import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../api/pharmacyIntegration.api', () => ({
  pharmacyIntegrationApi: {
    verifyMarking: vi.fn(),
  },
}));

vi.mock('../../../services/pos/posDataRouter', () => ({
  posFetchProductByBarcode: vi.fn(),
  posFetchProductsPage: vi.fn(async () => ({ content: [] })),
}));

vi.mock('../../../api/tasnif.api', () => ({
  tasnifApi: { lookup: vi.fn(async () => ({ data: null })) },
}));

vi.mock('../../../api/pharmacySales.api', () => ({
  pharmacySalesApi: { checkMarkSold: vi.fn(async () => ({ data: { sold: false } })) },
}));

vi.mock('../../../api/pharmacyStockMarks.api', () => ({
  pharmacyStockMarksApi: { check: vi.fn(async () => ({ data: { found: false } })) },
}));
vi.mock('../../../api/sale.api', () => ({
  saleApi: { checkMarkSold: vi.fn(async () => ({ data: { sold: false } })) },
}));

const validateFiscalMarking = vi.fn(async () => ({ status: 'VALID' }));
vi.mock('../../marking/onkm/validate', () => ({
  MARKING_VALIDATION_STATUS: {
    VALID: 'VALID',
    REJECTED: 'REJECTED',
    UNAVAILABLE: 'UNAVAILABLE',
    NOT_REQUIRED: 'NOT_REQUIRED',
  },
  validateFiscalMarking: (...args) => validateFiscalMarking(...args),
}));

import { pharmacyIntegrationApi } from '../../../api/pharmacyIntegration.api';
import { pharmacySalesApi } from '../../../api/pharmacySales.api';
import { saleApi } from '../../../api/sale.api';
import { tasnifApi } from '../../../api/tasnif.api';
import { posFetchProductByBarcode, posFetchProductsPage } from '../../../services/pos/posDataRouter';
import { clearSoldMarks } from '../../marking';
import { resolvePosMarkedProduct } from './resolvePosMarkedProduct';

const KM = '010478001234567821AbCdEfGhIj';
const EAN = '4780012345678';
const product = {
  id: 11,
  barcode: EAN,
  name: 'Чай',
  markedProduct: true,
  ikpu: '02208001001926001',
};

describe('resolvePosMarkedProduct — путь только для КМ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSoldMarks(7);
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: false } });
    validateFiscalMarking.mockResolvedValue({ status: 'VALID' });
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

  it('КМ уже в журнале, Tasnif не спрашивали → sold', async () => {
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
      aslEnabled: false,
    });
    expect(result.status).toBe('sold');
    expect(result.product).toBeNull();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('КМ уже в журнале, Tasnif VALID — всё равно ищем товар и в чек', async () => {
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
      cashRegisterId: 11,
      aslEnabled: false,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(11);
    expect(validateFiscalMarking).toHaveBeenCalled();
  });

  it('ASL не спрашиваем — sold только из нашего журнала', async () => {
    pharmacyIntegrationApi.verifyMarking.mockResolvedValue({
      data: { found: true, alreadySold: true, status: 'SOLD' },
    });
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
    });
    expect(result.status).toBe('ok');
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
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

  it('карточки нет — Tasnif 1016 всё равно, не «не найден»', async () => {
    const { tasnifApi } = await import('../../../api/tasnif.api');
    tasnifApi.lookup.mockResolvedValue({
      data: { mxik: '02208001001926001', name: 'Naleyka', packageCode: '1' },
    });
    validateFiscalMarking.mockResolvedValue({
      status: 'REJECTED',
      code: '1016',
      message: 'Код уже выведен из оборота',
    });
    const result = await resolvePosMarkedProduct({
      products: [],
      rawCode: KM,
      storeId: 7,
      cashRegisterId: 11,
    });
    expect(result.status).toBe('withdrawn');
    expect(result.message).toBe('Код уже выведен из оборота');
    expect(validateFiscalMarking).toHaveBeenCalled();
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

  it('КМ с GTIN-14 → находит карточку с EAN-8 (ведущие нули)', async () => {
    const ean8Product = { id: 22, barcode: '47804357', name: 'Молоко', markedProduct: true };
    const kmEan8 = '0100000047804357217xv.2/=z0yd2Fku';
    posFetchProductByBarcode.mockImplementation(async (_storeId, barcode) => (
      barcode === '47804357' ? ean8Product : null
    ));
    const result = await resolvePosMarkedProduct({
      products: [],
      rawCode: kmEan8,
      storeId: 7,
      aslEnabled: false,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(22);
    expect(posFetchProductByBarcode).toHaveBeenCalledWith(7, '47804357');
  });

  it('КМ без AI 01 → всё равно находит EAN-8', async () => {
    const ean8Product = { id: 22, barcode: '47804357', name: 'Молоко', markedProduct: true };
    posFetchProductByBarcode.mockImplementation(async (_storeId, barcode) => (
      barcode === '47804357' ? ean8Product : null
    ));
    const result = await resolvePosMarkedProduct({
      products: [],
      rawCode: '000000478043577xv.2/=z0yd2Fku',
      storeId: 7,
      aslEnabled: false,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(22);
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

  it('Tasnif 1016 — уже не в обороте, в чек нельзя', async () => {
    validateFiscalMarking.mockResolvedValue({
      status: 'REJECTED',
      code: '1016',
      message: 'Код уже выведен из оборота',
    });
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
      cashRegisterId: 11,
      aslEnabled: false,
    });
    expect(result.status).toBe('withdrawn');
    expect(result.product).toBeNull();
    expect(result.message).toBe('Код уже выведен из оборота');
  });

  it('Tasnif VALID — в обороте, в чек', async () => {
    const result = await resolvePosMarkedProduct({
      products: [product],
      rawCode: KM,
      storeId: 7,
      cashRegisterId: 11,
      aslEnabled: false,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(11);
    expect(validateFiscalMarking).toHaveBeenCalled();
  });
});

describe('касса — жёсткий путь Tasnif + склад', () => {
  const vodkaKm = '0104780083110808217Ф*7щгЮ93Вкф7';
  const vodka = {
    id: 77,
    barcode: '9990001112223',
    ikpu: '02208001001926001',
    name: 'Водка: Naleyka',
    markedProduct: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearSoldMarks(7);
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: false } });
    posFetchProductByBarcode.mockResolvedValue(null);
    posFetchProductsPage.mockResolvedValue({ content: [] });
    tasnifApi.lookup.mockResolvedValue({
      data: { mxik: '02208001001926001', name: vodka.name, packageCode: '1077302' },
    });
    validateFiscalMarking.mockResolvedValue({ status: 'VALID' });
  });

  it('GTIN нет на карточке — Tasnif ИКПУ находит маркированную водку на складе', async () => {
    const result = await resolvePosMarkedProduct({
      products: [vodka],
      rawCode: vodkaKm,
      storeId: 7,
      cashRegisterId: 11,
    });
    expect(result.status).toBe('ok');
    expect(result.circulation).toBe('in-circulation');
    expect(result.product.id).toBe(77);
    expect(result.product.productMarks).toEqual([vodkaKm]);
    expect(tasnifApi.lookup).toHaveBeenCalled();
    expect(validateFiscalMarking).toHaveBeenCalled();
    expect(pharmacyIntegrationApi.verifyMarking).not.toHaveBeenCalled();
  });

  it('Tasnif 1002 чужой — в чек нельзя, даже если склад есть', async () => {
    validateFiscalMarking.mockResolvedValue({
      status: 'REJECTED',
      code: '1002',
      message: 'Указанный код маркировки не принадлежит вам.',
    });
    const result = await resolvePosMarkedProduct({
      products: [vodka],
      rawCode: vodkaKm,
      storeId: 7,
      cashRegisterId: 11,
    });
    expect(result.status).toBe('withdrawn');
    expect(result.product).toBeNull();
    expect(result.message).toMatch(/не принадлежит/);
  });

  it('Tasnif VALID, склада нет — не найден, не выдумываем карточку', async () => {
    const result = await resolvePosMarkedProduct({
      products: [],
      rawCode: vodkaKm,
      storeId: 7,
      cashRegisterId: 11,
    });
    expect(result.status).toBe('not-found');
    expect(result.product).toBeNull();
    expect(tasnifApi.lookup).toHaveBeenCalled();
  });

  it('наш журнал говорит sold, Tasnif VALID — всё равно в чек', async () => {
    saleApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });
    pharmacySalesApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });
    const result = await resolvePosMarkedProduct({
      products: [vodka],
      rawCode: vodkaKm,
      storeId: 7,
      cashRegisterId: 11,
    });
    expect(result.status).toBe('ok');
    expect(result.product.id).toBe(77);
    expect(result.circulation).toBe('in-circulation');
  });

  it('Tasnif UNAVAILABLE — в чек можно, circulation не in-circulation', async () => {
    validateFiscalMarking.mockResolvedValue({ status: 'UNAVAILABLE', message: 'нет сети' });
    const result = await resolvePosMarkedProduct({
      products: [vodka],
      rawCode: vodkaKm,
      storeId: 7,
      cashRegisterId: 11,
    });
    expect(result.status).toBe('ok');
    expect(result.circulation).toBe('unavailable');
  });
});
