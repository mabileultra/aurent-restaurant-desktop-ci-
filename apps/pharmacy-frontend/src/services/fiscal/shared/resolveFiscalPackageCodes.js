import { tasnifApi } from '../../../api/tasnif.api';

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

function mentionsUnit(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-zа-яё0-9])${escaped}([^a-zа-яё0-9]|$)`).test(text);
}

/** G / KG / MG по названию упаковки Tasnif. «килограмм» не считается граммом. */
export function packageMeasureKind(pkg) {
  const text = packageLabel(pkg);
  if (mentionsUnit(text, 'миллиграмм') || mentionsUnit(text, 'мг') || mentionsUnit(text, 'mg')) return 'MG';
  if (
    mentionsUnit(text, 'килограмм')
    || mentionsUnit(text, 'киллограмм')
    || mentionsUnit(text, 'kilogram')
    || mentionsUnit(text, 'кг')
    || mentionsUnit(text, 'kg')
  ) return 'KG';
  if (
    mentionsUnit(text, 'грамм')
    || mentionsUnit(text, 'грам')
    || mentionsUnit(text, 'gramm')
    || mentionsUnit(text, 'gram')
    || mentionsUnit(text, 'г')
    || mentionsUnit(text, 'g')
  ) return 'G';
  return '';
}

/** Единица строки продажи: код карточки или подпись. */
export function lineMeasureKind(line) {
  const code = String(line?.unitCode || '').trim().toUpperCase();
  if (code === 'G' || code === 'KG' || code === 'MG') return code;
  const label = String(line?.unitOfMeasure || line?.unitLabel || '').trim().toLowerCase();
  if (['g', 'г', 'гр', 'грамм', 'gram', 'gramm'].includes(label)) return 'G';
  if (['kg', 'кг', 'килограмм', 'киллограмм', 'kilogram'].includes(label)) return 'KG';
  if (['mg', 'мг', 'миллиграмм'].includes(label)) return 'MG';
  return '';
}

function packageDisplayName(pkg, fallback) {
  return pkg?.nameRu || pkg?.nameUz || pkg?.nameLat || fallback || '';
}

/**
 * Код «1» не берём. Если упаковок несколько — по количеству в названии, иначе штука, иначе первая.
 * Продажу из-за этого не останавливаем.
 */
export function pickTasnifPackage(item, line) {
  const packages = realTasnifPackages(item);
  if (packages.length === 0) return null;

  const wanted = lineMeasureKind(line);
  if (wanted === 'G' || wanted === 'KG' || wanted === 'MG') {
    const matched = packages.find((pkg) => packageMeasureKind(pkg) === wanted);
    if (matched) return matched;
    // Грамм не подменяем килограммом: количество в продаже уже в граммах.
    if (wanted === 'G' || wanted === 'MG') return null;
  }

  if (packages.length === 1) return packages[0];

  const packCount = packCountFromLine(line);
  if (packCount) {
    const matched = packages.find((pkg) => packageCount(pkg) === packCount);
    if (matched) return matched;
  }
  return packages.find(isPiecePackage) || packages[0];
}

function realignToSaleUnit(line) {
  const kind = lineMeasureKind(line);
  return kind === 'G' || kind === 'MG';
}

async function enrichLinePackage(line) {
  const ikpu = String(line?.ikpu || line?.classifierClassCode || '').trim();
  const realign = realignToSaleUnit(line);
  if (isRealFiscalPackageCode(line?.packageCode) && !realign) return line;
  if (!ikpu) return line;
  try {
    const res = await tasnifApi.detail({ mxik: ikpu });
    const pkg = pickTasnifPackage(res.data, line);
    if (!pkg) return line;
    if (realign && packageMeasureKind(pkg) !== lineMeasureKind(line)) return line;
    return {
      ...line,
      packageCode: String(pkg.code).trim(),
      packageName: packageDisplayName(pkg, line.packageName),
    };
  } catch {
    return line;
  }
}

/** Имя упаковки в фискальный чек. Для грамма не подставляем «килограмм». */
export function resolveFiscalPackageName(line) {
  const wanted = lineMeasureKind(line);
  const pkgName = String(line?.packageName || '').trim();
  if (wanted === 'G' || wanted === 'MG') {
    if (pkgName && packageMeasureKind({ nameRu: pkgName }) === wanted) return pkgName;
    return line?.unitLabel || line?.unitOfMeasure || (wanted === 'G' ? 'г' : 'мг');
  }
  return pkgName || line?.unitOfMeasure || line?.unitLabel || 'sht';
}

export async function enrichFiscalPackageCodes(cartItems) {
  return Promise.all((cartItems || []).map(enrichLinePackage));
}
