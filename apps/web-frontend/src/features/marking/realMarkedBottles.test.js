import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../api/pharmacyIntegration.api', () => ({
  pharmacyIntegrationApi: { verifyMarking: vi.fn() },
}));
vi.mock('../../api/pharmacySales.api', () => ({
  pharmacySalesApi: { checkMarkSold: vi.fn(async () => ({ data: { sold: false } })) },
}));
vi.mock('../../api/pharmacyStockMarks.api', () => ({
  pharmacyStockMarksApi: { check: vi.fn(async () => ({ data: { found: false } })) },
}));
vi.mock('../../api/sale.api', () => ({
  saleApi: { checkMarkSold: vi.fn(async () => ({ data: { sold: false } })) },
}));

import { saleApi } from '../../api/sale.api';

import { classifyPosScanInput } from '../cashier/utils/classifyPosScanInput';
import { toOfdMarkingLabel } from '../../services/fiscal/shared/ofdMarkingLabel';
import { buildFiscalDriveItem } from '../../services/fiscal/providers/fiscalDrive/buildFiscalDriveItem';
import { buildSaleOperationBody } from '../../services/multikassa/buildMultikassaOperations';
import { expandMarkedFiscalItems } from '../../services/fiscal/shared/expandMarkedFiscalItems';
import { assessQtyMarkingScan } from '../pharmacy-cashier/utils/pharmacyQtyMarkingScan';
import {
  attachMarkToProduct,
  clearSoldMarks,
  extractGtinFromMarkingCode,
  isMarkingCode,
  isMarkSoldLocally,
  lookupProductByMarkingGtin,
  markingBarcodeCandidates,
  markingIdentificationCode,
  marksShareIdentity,
  rememberSoldMarks,
  resolveCashierMarking,
} from './index';

/** Реальные КМ с кассы: GTIN из DataMatrix, серия как со сканера. */
const NALEYKA = {
  km: '0104780083110808217Ф*7щгЮ93Вкф7',
  gtin: '04780083110808',
  barcode: '4780083110808',
  name: 'Водка: Naleyka, Крепость 40%, Стеклянная бутылка 0,25 л',
  ikpu: '02208001001926001',
  ki: '0104780083110808217Ф*7щгЮ',
};

const BLACK_GOLD = {
  km: '0104780131182498217?ыПдК793Тоы2',
  gtin: '04780131182498',
  barcode: '4780131182498',
  name: 'Водка: Чёрное золото, крепость 40% металлическая банка 0,25 л',
  ikpu: '02208001001231004',
  ki: '0104780131182498217?ыПдК7',
};

const CATALOG = [
  { id: 101, barcode: NALEYKA.barcode, name: NALEYKA.name, ikpu: NALEYKA.ikpu },
  { id: 202, barcode: BLACK_GOLD.barcode, name: BLACK_GOLD.name, ikpu: BLACK_GOLD.ikpu },
];

function sendToOfd(product, km) {
  const attached = attachMarkToProduct(product, km);
  const line = {
    productId: product.id,
    name: product.name,
    barcode: product.barcode,
    quantity: 1,
    unitPrice: 25000,
    ikpu: product.ikpu,
    packageCode: '1200001',
    taxRate: 12,
    productMarks: attached.productMarks,
  };
  const mk = buildSaleOperationBody({
    cartItems: [line],
    payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
    total: 25000,
    capabilities: { enabled: true, terminalId: 'YZ1', moduleNumber: 'M1' },
    shiftId: 's1',
    cashierName: 'CASHIER',
  }).items[0];
  const fd = buildFiscalDriveItem(line);
  return { attached, mk, fd };
}

describe('реальные КМ: поиск на кассе и отправка в ОФД', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSoldMarks(7);
    saleApi.checkMarkSold.mockResolvedValue({ data: { sold: false } });
  });

  it.each([NALEYKA, BLACK_GOLD])(
    '$name: скан = маркировка, GTIN из КМ, не штрихкод и не ИКПУ',
    (item) => {
      expect(isMarkingCode(item.km)).toBe(true);
      expect(classifyPosScanInput(item.km)).toBe('marking');
      expect(classifyPosScanInput(item.barcode)).toBe('barcode');
      expect(extractGtinFromMarkingCode(item.km)).toBe(item.gtin);
      expect(markingBarcodeCandidates(item.km)).toContain(item.barcode);
    },
  );

  it('касса находит карточку по GTIN, Tasnif ИКПУ не зовём', async () => {
    const lookupTasnifByBarcode = vi.fn();
    const fetchByBarcode = vi.fn(async (barcode) => (
      CATALOG.find((row) => row.barcode === barcode) || null
    ));

    const naleyka = await lookupProductByMarkingGtin({
      products: CATALOG,
      mark: NALEYKA.km,
      fetchByBarcode,
      lookupTasnifByBarcode,
    });
    const gold = await lookupProductByMarkingGtin({
      products: CATALOG,
      mark: BLACK_GOLD.km,
      fetchByBarcode,
      lookupTasnifByBarcode,
    });

    expect(naleyka).toMatchObject({ id: 101, barcode: NALEYKA.barcode });
    expect(gold).toMatchObject({ id: 202, barcode: BLACK_GOLD.barcode });
    expect(naleyka.id).not.toBe(gold.id);
    expect(lookupTasnifByBarcode).not.toHaveBeenCalled();
  });

  it.each([NALEYKA, BLACK_GOLD])(
    '$name: в чек полный КМ, в ОФД — КИ без 93',
    (item) => {
      const product = CATALOG.find((row) => row.barcode === item.barcode);
      const { attached, mk, fd } = sendToOfd(product, item.km);
      expect(attached.productMarks).toEqual([item.km]);
      expect(markingIdentificationCode(item.km)).toBe(item.ki);
      expect(toOfdMarkingLabel(item.km)).toBe(item.ki);
      expect(mk.product_mark).toBe(item.ki);
      expect(mk.product_label).toBe(item.ki);
      expect(fd.Labels).toEqual([item.ki]);
      expect(mk.product_mark).not.toMatch(/93/);
      expect(fd.Labels[0]).not.toMatch(/93/);
    },
  );

  it('два разных КМ — две пачки, не схлопываются', () => {
    expect(marksShareIdentity(NALEYKA.km, BLACK_GOLD.km)).toBe(false);
  });

  it('оба КМ в одном чеке уходят и в Multikassa, и в FiscalDrive', () => {
    const lines = expandMarkedFiscalItems([
      {
        productId: 101,
        name: NALEYKA.name,
        quantity: 1,
        unitPrice: 25000,
        ikpu: NALEYKA.ikpu,
        packageCode: '1002447',
        taxRate: 12,
        productMarks: [NALEYKA.km],
      },
      {
        productId: 202,
        name: BLACK_GOLD.name,
        quantity: 1,
        unitPrice: 25000,
        ikpu: BLACK_GOLD.ikpu,
        packageCode: '1803483',
        taxRate: 12,
        productMarks: [BLACK_GOLD.km],
      },
    ]);
    const mk = buildSaleOperationBody({
      cartItems: lines,
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 50000,
      capabilities: { enabled: true, terminalId: 'YZ1', moduleNumber: 'M1' },
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(mk.items.map((item) => item.product_mark)).toEqual([NALEYKA.ki, BLACK_GOLD.ki]);
    expect(mk.items.map((item) => item.product_label)).toEqual([NALEYKA.ki, BLACK_GOLD.ki]);
    expect(buildFiscalDriveItem(lines[0]).Labels).toEqual([NALEYKA.ki]);
    expect(buildFiscalDriveItem(lines[1]).Labels).toEqual([BLACK_GOLD.ki]);
  });

  it('журнал grocery sold — «уже пробита» без локального кэша и на другом товаре', async () => {
    saleApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });
    const findOther = vi.fn(async () => CATALOG[1]);
    const resolved = await resolveCashierMarking({
      rawCode: NALEYKA.km,
      storeId: 7,
      aslEnabled: false,
      findProduct: findOther,
    });
    expect(resolved.status).toBe('sold');
    expect(isMarkSoldLocally(7, NALEYKA.ki)).toBe(true);
  });

  it('пробитый КМ — «уже пробита», даже если ищем другой товар', async () => {
    saleApi.checkMarkSold.mockResolvedValue({ data: { sold: true, status: 'SOLD' } });
    rememberSoldMarks(7, [NALEYKA.km]);
    const findOther = vi.fn(async () => CATALOG[1]);
    const resolved = await resolveCashierMarking({
      rawCode: NALEYKA.km,
      storeId: 7,
      aslEnabled: false,
      findProduct: findOther,
    });
    expect(resolved.status).toBe('sold');
    expect(resolved.product).toBeNull();
    expect(assessQtyMarkingScan({
      product: CATALOG[1],
      rawCode: NALEYKA.km,
      storeId: 7,
    }).status).toBe('sold');
  });
});
