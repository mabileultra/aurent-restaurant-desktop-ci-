import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toOfdMarkingLabel } from '../../services/fiscal/shared/ofdMarkingLabel';
import { buildFiscalDriveItem } from '../../services/fiscal/providers/fiscalDrive/buildFiscalDriveItem';
import { buildSaleOperationBody } from '../../services/multikassa/buildMultikassaOperations';
import { expandMarkedFiscalItems } from '../../services/fiscal/shared/expandMarkedFiscalItems';
import { buildCheckoutLineItems } from '../../store/cartStore';
import { classifyPosScanInput } from '../cashier/utils/classifyPosScanInput';
import {
  assessMarkLifecycle,
  attachMarkToProduct,
  clearSoldMarks,
  isMarkSoldLocally,
  lineMarkingCodes,
  lookupProductByMarkingGtin,
  planMarkedScan,
  rememberSoldMarks,
} from './index';

const GTIN = '4780012345678';
const KM = `010${GTIN}21PACK001\u001d91CRYPTAA`;
const KM_OTHER_TAIL = `010${GTIN}21PACK001\u001d91OTHERZZ`;
const KI = `010${GTIN}21PACK001`;
const product = {
  id: 11,
  barcode: GTIN,
  name: 'Чай',
  ikpu: '03004409005039001',
  packageCode: '1546940',
  taxRate: 12,
  unitPrice: 10,
  quantity: 1,
};

describe('касса: схема маркировки', () => {
  beforeEach(() => {
    clearSoldMarks(3);
  });

  it('скан отличает КМ от EAN и от QR налоговой', () => {
    expect(classifyPosScanInput(KM)).toBe('marking');
    expect(classifyPosScanInput(GTIN)).toBe('barcode');
    expect(classifyPosScanInput('https://ofd.soliq.uz/check?t=ZZ1&r=1&c=20240904094538&s=1'))
      .toBe('barcode');
  });

  it('товар ищем по GTIN из КМ, не по ИКПУ', async () => {
    const lookupTasnifByBarcode = vi.fn(async () => ({ mxik: product.ikpu }));
    const hit = await lookupProductByMarkingGtin({
      products: [
        { id: 22, barcode: '999', ikpu: product.ikpu, name: 'Другой' },
        product,
      ],
      mark: KM,
      fetchByBarcode: vi.fn(),
      lookupTasnifByBarcode,
    });
    expect(hit.id).toBe(11);
    expect(lookupTasnifByBarcode).not.toHaveBeenCalled();
  });

  it('в чек кладём полный КМ; в ОФД уходит КИ без криптохвоста', () => {
    const attached = attachMarkToProduct({ id: 1, name: 'Чай', barcode: GTIN }, KM);
    expect(attached.productMarks).toEqual([KM]);
    expect(toOfdMarkingLabel(attached.productMarks[0])).toBe(KI);
    expect(buildCheckoutLineItems([{
      productId: product.id,
      quantity: 1,
      unitPrice: 10,
      productMarks: [KM],
    }])[0].productMarks).toEqual([KM]);
  });

  it('повтор той же пачки в чеке — duplicate, даже с другим криптохвостом', () => {
    const first = planMarkedScan([], product, KM);
    const items = [{
      lineId: 'L1',
      productId: product.id,
      quantity: 1,
      productMarks: [first.mark],
    }];
    expect(assessMarkLifecycle({ rawCode: KM_OTHER_TAIL, cartItems: items }).status)
      .toBe('duplicate');
  });

  it('после продажи та же пачка — sold', () => {
    rememberSoldMarks(3, [KM]);
    expect(isMarkSoldLocally(3, KM_OTHER_TAIL)).toBe(true);
    expect(assessMarkLifecycle({
      rawCode: KM_OTHER_TAIL,
      cartItems: [],
      storeId: 3,
      locallySold: true,
    }).status).toBe('sold');
  });

  it('Multikassa: product_mark и product_label = КИ; пустые поля не шлём', () => {
    const [line] = expandMarkedFiscalItems([{
      productId: 1,
      name: 'Чай',
      quantity: 1,
      unitPrice: 10,
      ikpu: product.ikpu,
      packageCode: product.packageCode,
      taxRate: 12,
      productMarks: [KM],
    }]);
    const body = buildSaleOperationBody({
      cartItems: [line],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 10,
      capabilities: { enabled: true, terminalId: 'YZ1', moduleNumber: 'M1' },
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(body.items[0].product_mark).toBe(KI);
    expect(body.items[0].product_label).toBe(KI);

    const plain = buildSaleOperationBody({
      cartItems: [{
        productId: 2,
        name: 'Сахар',
        quantity: 1,
        unitPrice: 10,
        ikpu: product.ikpu,
        packageCode: product.packageCode,
        taxRate: 12,
      }],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 10,
      capabilities: { enabled: true, terminalId: 'YZ1', moduleNumber: 'M1' },
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(plain.items[0].product_mark).toBeUndefined();
    expect(plain.items[0].product_label).toBeUndefined();
  });

  it('FiscalDrive: Labels = КИ; строка только с productMark тоже уходит', () => {
    const expanded = expandMarkedFiscalItems([{
      name: 'Чай',
      ikpu: product.ikpu,
      quantity: 1,
      unitPrice: 10,
      productMark: KM,
    }]);
    expect(lineMarkingCodes(expanded[0])).toEqual([KM]);
    expect(buildFiscalDriveItem({
      name: 'Чай',
      ikpu: product.ikpu,
      quantity: 1,
      unitPrice: 10,
      productMarks: [KM],
    }).Labels).toEqual([KI]);
  });
});
