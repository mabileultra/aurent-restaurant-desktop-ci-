import { describe, expect, it } from 'vitest';
import { pickVisibleCatalogFormValues } from './pickVisibleCatalogFormValues';
import { buildProductCatalogPayload } from './buildProductCatalogPayload';

function showMap(map) {
  return (section) => map[section] !== false;
}

describe('pickVisibleCatalogFormValues', () => {
  const dirty = {
    name: 'Tea',
    sku: 'T1',
    description: 'hidden desc',
    categoryId: '9',
    costPrice: 100,
    sellingPrice: 14000,
    defaultDiscountPercent: 15,
    taxRate: 12,
    lowStockAlert: 99,
    storageLocation: 'A1',
    initialStock: 5,
    barcode: '460123',
    plu: '12',
    externalProductId: 'ext',
    ikpu: '123',
    unitMeasureCode: '1',
    packageCode: '2',
    productType: 'RETAIL',
    saleType: 'PIECE',
    unitCode: 'PCS',
    quantityScale: 0,
    allowFraction: false,
    unitOfMeasure: 'pcs',
    soldIndividually: false,
    markedProduct: true,
    ownerType: 'COMMISSION',
    commissionTin: '123456789',
    commissionPinfl: '123',
    active: false,
  };

  it('keeps visible field values', () => {
    const out = pickVisibleCatalogFormValues(dirty, () => true);
    expect(out.sellingPrice).toBe(14000);
    expect(out.barcode).toBe('460123');
    expect(out.taxRate).toBe(12);
    expect(out.markedProduct).toBe(true);
  });

  it('drops hidden optional fields and resets required accounting/tax', () => {
    const out = pickVisibleCatalogFormValues(
      dirty,
      showMap({
        descriptionField: false,
        categoryField: false,
        barcodes: false,
        pluField: false,
        fiscalExternalId: false,
        fiscalIkpu: false,
        fiscalUnitMeasure: false,
        fiscalPackageCode: false,
        retailFlags: false,
        ownerType: false,
        vatField: false,
        commissionTin: false,
        commissionPinfl: false,
        accountingDiscount: false,
        accountingLowStock: false,
        accountingLocation: false,
        accountingStock: false,
        accountingCost: false,
        accountingSell: true,
        accounting: true,
        activeField: false,
      })
    );

    expect(out.description).toBeUndefined();
    expect(out.categoryId).toBeNull();
    expect(out.barcode).toBeUndefined();
    expect(out.plu).toBeUndefined();
    expect(out.ikpu).toBeUndefined();
    expect(out.soldIndividually).toBeUndefined();
    expect(out.markedProduct).toBeUndefined();
    expect(out.ownerType).toBe('OWN');
    expect(out.taxRate).toBe(0);
    expect(out.commissionTin).toBeUndefined();
    expect(out.defaultDiscountPercent).toBe(0);
    expect(out.lowStockAlert).toBeUndefined();
    expect(out.storageLocation).toBeNull();
    expect(out.initialStock).toBe(0);
    expect(out.costPrice).toBe(0);
    expect(out.sellingPrice).toBe(14000);
    expect(out.active).toBe(true);
  });

  it('does not use hidden sellingPrice when sell section off', () => {
    const out = pickVisibleCatalogFormValues(
      { ...dirty, costPrice: 50, sellingPrice: 1 },
      showMap({ accounting: true, accountingCost: true, accountingSell: false })
    );
    expect(out.sellingPrice).toBe(50);
  });
});

describe('buildProductCatalogPayload visibility', () => {
  it('ignores stale store row price and hidden barcodes', () => {
    const payload = buildProductCatalogPayload({
      values: {
        name: 'Tea',
        sellingPrice: 14000,
        costPrice: 100,
        taxRate: 0,
        productType: 'RETAIL',
        saleType: 'PIECE',
        unitCode: 'PCS',
        ownerType: 'OWN',
        barcode: 'should-skip',
      },
      storeRows: [{ storeId: '5', price: '1' }],
      extraBarcodes: ['111', '222'],
      effectiveBusinessType: 'UNIVERSAL',
      businessConfigFields: [],
      showSection: showMap({ storePrices: false, barcodes: false, extraBarcodes: false }),
      selectedStoreId: 5,
    });

    expect(payload.storePrices).toEqual([{ storeId: 5, price: 14000 }]);
    expect(payload.barcode).toBeUndefined();
    expect(payload.additionalBarcodes).toEqual([]);
    expect(payload.sellingPrice).toBe(14000);
  });
});
