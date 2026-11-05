import { isRealFiscalPackageCode } from '../../../services/fiscal/shared/resolveFiscalPackageCodes';

export const IMPORT_MATCH_TONES = ['found', 'partial', 'missing', 'duplicate'];

export function classifyPharmacyImportMatch(item) {
  if (!item || item.status === 'DUPLICATE') return 'duplicate';
  if (item.ikpuStatus === 'FOUND') {
    if (item.markedProduct && !isRealFiscalPackageCode(item.packageCode)) return 'partial';
    return 'found';
  }
  return 'missing';
}

export function defaultImportMatchSelected(item) {
  const tone = classifyPharmacyImportMatch(item);
  return tone === 'found' || tone === 'partial';
}
