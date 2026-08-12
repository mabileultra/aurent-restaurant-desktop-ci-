import { buildLabelPrintJob, printShelfLabel, loadSavedLabelLayout } from '../../../shelfLabelPrint';
import { encodeWeightBarcode } from './weightBarcode';

/**
 * Печать весовой этикетки тем же пайплайном, что и ценники.
 */
export async function printWeightLabel({ product, weightKg, t, copies = 1 }) {
  const plu = product?.plu;
  if (!plu) {
    throw new Error('Product has no PLU');
  }
  const kg = Number(weightKg);
  if (!Number.isFinite(kg) || kg <= 0) {
    throw new Error('Invalid weight');
  }

  const barcode = encodeWeightBarcode(plu, kg);
  const unitPrice = Number(product.sellingPrice ?? 0);
  const total = Math.round(unitPrice * kg * 100) / 100;
  const name = `${product.name || ''} · ${kg.toFixed(3).replace(/\.?0+$/, '')} кг`.trim();

  const printJob = buildLabelPrintJob({
    productName: name,
    barcode,
    price: total,
    variant: 'label',
    showName: true,
    showBarcode: true,
    showPrice: true,
    copies,
    layoutMode: 'auto',
    layout: loadSavedLabelLayout(),
  });

  return printShelfLabel(printJob, t);
}
