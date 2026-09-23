import { filterPlausibleImportMarkCodes } from './isPlausibleImportMarkCode';

export function toPharmacyImportConfirmItem(item) {
  const expiry = item.expiryDate && String(item.expiryDate).length >= 8 ? item.expiryDate : undefined;
  return {
    rowIndex: item.rowIndex,
    createIfMissing: true,
    excelName: item.excelName,
    manufacturer: item.manufacturer,
    country: item.country,
    quantity: item.quantity,
    purchasePrice: item.purchasePrice,
    vatPercent: item.vatPercent,
    retailPrice: item.retailPrice,
    batchNumber: item.batchNumber,
    expiryDate: expiry,
    barcode: item.barcode,
    ikpu: item.ikpu,
    unitsInPack: item.unitsInPack,
    markCodes: filterPlausibleImportMarkCodes(item.markCodes),
    markedProduct: Boolean(item.markedProduct),
    prescriptionRequired: item.prescriptionRequired === true
      ? true
      : item.prescriptionRequired === false ? false : undefined,
    packageCode: item.packageCode || undefined,
    ikpuStatus: item.ikpuStatus || undefined,
  };
}
