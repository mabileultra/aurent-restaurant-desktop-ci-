import { describe, it, expect } from 'vitest';
import { buildPharmacyProductsSheetRows } from './pharmacyProductsExportCsv';

const t = (key) => ({
  'pharmacyStock.colName': 'Наименование',
  'stockReports.colSupplier': 'Поставщик',
  'pharmacyStock.colDocNo': 'Документ №',
  'pharmacyStock.colDate': 'Дата',
  'stockModule.colQty': 'Кол-во',
  'pharmacyStock.retailPrice': 'Розничная цена',
  'pharmacyStock.colManufacturer': 'Производитель',
  'pharmacyStock.colForm': 'Форма',
  'pharmacyStock.productAtc': 'АТХ',
  'pharmacyStock.productBarcodes': 'Штрихкоды',
  'pharmacyStock.productMxik': 'ИКПУ',
  'pharmacyStock.unitsInPack': 'В упаковке',
  'pharmacyStock.colCountry': 'Страна',
  'pharmacyStock.colUpdated': 'Обновлён',
}[key] || key);

describe('buildPharmacyProductsSheetRows', () => {
  it('matches table columns with localized headers and keeps codes as text', () => {
    const rows = buildPharmacyProductsSheetRows([
      {
        name: 'АЦЦ 200мг',
        stockQuantity: 2,
        sellingPrice: 25000,
        barcode: '300420000000001',
        ikpu: '01799001001000000',
        attributes: {
          manufacturer: 'Sandoz',
          dosage_form: 'пор.',
          country: 'Узбекистан',
          atc_code: 'R05',
        },
      },
    ], t);

    expect(rows[0]).toEqual([
      '№',
      'Наименование',
      'Поставщик',
      'Документ №',
      'Дата',
      'Кол-во',
      'Розничная цена',
      'Производитель',
      'Форма',
      'АТХ',
      'Штрихкоды',
      'ИКПУ',
      'В упаковке',
      'Страна',
      'Обновлён',
    ]);
    expect(rows[1][0]).toBe(1);
    expect(rows[1][1]).toBe('АЦЦ 200мг');
    expect(rows[1][10]).toBe('300420000000001');
    expect(rows[1][11]).toBe('01799001001000000');
    expect(rows[1][7]).toBe('Sandoz');
  });
});
