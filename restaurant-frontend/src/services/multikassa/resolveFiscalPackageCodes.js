import { tasnifApi } from '../../api/tasnif.api';

/** «1» — единица измерения, не код упаковки Tasnif. */
export function isRealFiscalPackageCode(value) {
  const code = String(value || '').trim();
  return /^\d{3,}$/.test(code) && code !== '1';
}

export function realTasnifPackages(item) {
  return (item?.packages ?? []).filter((pkg) => isRealFiscalPackageCode(pkg?.code));
}

function packageLabel(pkg) {
  return `${pkg?.nameRu || ''} ${pkg?.nameUz || ''} ${pkg?.nameLat || ''}`.toLowerCase();
}

function packageCount(pkg) {
  const text = packageLabel(pkg);
  const match = text.match(/=\s*(\d+)/) || text.match(/(\d+)\s*(шт|dona|pcs)/);
  return match ? Number(match[1]) : null;
}

function packCountFromLine(line) {
  const units = Number(line?.unitsInPack);
  if (units > 1) return units;
  const name = String(line?.name || '');
  const numbered = name.match(/№\s*(\d+)/) || name.match(/(\d+)\s*(шт|dona)/i);
  return numbered ? Number(numbered[1]) : null;
}

function isPiecePackage(pkg) {
  const text = packageLabel(pkg).trim();
  return text.startsWith('шт') || text.startsWith('dona') || text.startsWith('piece');
}

/**
 * Код «1» не берём. Если упаковок несколько — по количеству в названии, иначе штука, иначе первая.
 * Продажу из-за этого не останавливаем.
 */
export function pickTasnifPackage(item, line) {
  const packages = realTasnifPackages(item);
  if (packages.length === 0) return null;
  if (packages.length === 1) return packages[0];

  const wanted = packCountFromLine(line);
  if (wanted) {
    const matched = packages.find((pkg) => packageCount(pkg) === wanted);
    if (matched) return matched;
  }
  return packages.find(isPiecePackage) || packages[0];
}

async function enrichLinePackage(line) {
  if (isRealFiscalPackageCode(line?.packageCode)) return line;
  const ikpu = String(line?.ikpu || line?.classifierClassCode || '').trim();
  if (!ikpu) return line;
  try {
    const res = await tasnifApi.detail({ mxik: ikpu });
    const pkg = pickTasnifPackage(res.data, line);
    if (!pkg) return line;
    return {
      ...line,
      packageCode: String(pkg.code).trim(),
      packageName: pkg.nameUz || pkg.nameRu || pkg.nameLat || line.packageName,
    };
  } catch {
    return line;
  }
}

export async function enrichFiscalPackageCodes(cartItems) {
  return Promise.all((cartItems || []).map(enrichLinePackage));
}
