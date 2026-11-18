import { tasnifApi } from '../../api/tasnif.api';
import {
  extractGtinFromMarkingCode,
  gtinPackagingIndicator,
} from './markingCode';
import {
  pickTasnifBlockPackage,
} from '../../services/fiscal/shared/resolveFiscalPackageCodes';

/**
 * КМ блока (GTIN-14 indicator ≥ 1): размер блока и packageCode из Tasnif.
 * Штука (indicator 0) → null. Склад списывает unitsInPack шт за один КМ.
 */
export async function resolveBlockPackFromTasnif({ ikpu, mark }) {
  const gtin = extractGtinFromMarkingCode(mark);
  const indicator = gtinPackagingIndicator(gtin);
  if (indicator == null || indicator < 1) return null;

  const mxik = String(ikpu || '').replace(/\D/g, '');
  if (mxik.length < 8) return null;

  try {
    const res = await tasnifApi.detail({ mxik });
    // axios body is res.data; some callers already unwrap — accept both.
    const item = res?.data?.packages ? res.data : (res?.packages ? res : res?.data);
    const picked = pickTasnifBlockPackage(item);
    if (!picked?.pkg || !(picked.count > 1)) return null;
    return {
      sellAsBlock: true,
      unitsInPack: picked.count,
      packageCode: String(picked.pkg.code).trim(),
      packageName: picked.pkg.nameRu || picked.pkg.nameUz || picked.pkg.nameLat || null,
    };
  } catch {
    return null;
  }
}
