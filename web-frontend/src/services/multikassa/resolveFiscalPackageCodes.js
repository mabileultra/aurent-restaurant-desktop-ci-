import { tasnifApi } from '../../api/tasnif.api';

/** «1» — единица измерения, не код упаковки Tasnif. */
export function isRealFiscalPackageCode(value) {
  const code = String(value || '').trim();
  return /^\d{3,}$/.test(code) && code !== '1';
}

export function realTasnifPackages(item) {
  return (item?.packages ?? []).filter((pkg) => isRealFiscalPackageCode(pkg?.code));
}

/** Одна реальная упаковка — можно подставить. Несколько — только выбор в карточке. */
export function pickTasnifPackage(item) {
  const packages = realTasnifPackages(item);
  return packages.length === 1 ? packages[0] : null;
}

export async function enrichFiscalPackageCodes(cartItems) {
  const next = [];
  for (const line of cartItems) {
    if (isRealFiscalPackageCode(line?.packageCode)) {
      next.push(line);
      continue;
    }
    const ikpu = String(line?.ikpu || line?.classifierClassCode || '').trim();
    if (!ikpu) {
      next.push(line);
      continue;
    }
    try {
      const res = await tasnifApi.detail({ mxik: ikpu });
      const pkg = pickTasnifPackage(res.data);
      if (!pkg) {
        next.push(line);
        continue;
      }
      next.push({
        ...line,
        packageCode: String(pkg.code).trim(),
        packageName: pkg.nameUz || pkg.nameRu || pkg.nameLat || line.packageName,
      });
    } catch {
      next.push(line);
    }
  }
  return next;
}
