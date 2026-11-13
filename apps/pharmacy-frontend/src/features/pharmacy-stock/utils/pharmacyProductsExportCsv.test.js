import { describe, it, expect } from 'vitest';
import { buildPharmacyProductsCsv } from './pharmacyProductsExportCsv';

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

describe('buildPharmacyProductsCsv', () => {
  it('matches table columns with localized headers and semicolon sep', () => {
    const text = buildPharmacyProductsCsv([
      {
        name: 'АЦЦ 200мг',
        stockQuantity: 2,
        sellingPrice: 25000,
        barcode: '460',
        ikpu: '123',
        attributes: {
          manufacturer: 'Sandoz',
          dosage_form: 'пор.',
          country: 'Узбекистан',
          atc_code: 'R05',
        },
      },
    ], t);
    expect(text.startsWith('sep=;')).toBe(true);
    expect(text).toContain('№;Наименование;Поставщик;Документ №;Дата;Кол-во;Розничная цена');
    expect(text).toContain('Производитель;Форма;АТХ;Штрихкоды;ИКПУ;В упаковке;Страна;Обновлён');
    expect(text).not.toContain('sku;');
    expect(text).toMatch(/1;АЦЦ 200мг/);
  });
});
