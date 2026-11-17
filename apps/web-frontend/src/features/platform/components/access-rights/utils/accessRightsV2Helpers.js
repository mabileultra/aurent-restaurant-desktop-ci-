import { resolveBusinessTypeName } from './accessRightsCatalogUtils';

export function mapUsersWithCompanyAndBT({
  rawUsers,
  companiesMap,
  effectiveBT,
  selectedBT,
  t,
}) {
  return rawUsers
    .filter((u) => {
      const isPlatform =
        !u.companyId ||
        u.role === 'PLATFORM_ADMIN' ||
        u.role === 'PLATFORM_ANALYST' ||
        u.businessType === 'PLATFORM_STAFF';
      if (effectiveBT === 'PLATFORM_STAFF') return isPlatform;
      if (effectiveBT !== 'ALL' && isPlatform) return false;
      return true;
    })
    .map((u) => {
      const company = u.companyId ? companiesMap.get(u.companyId) : null;
      const btCode =
        u.businessType ||
        company?.businessType ||
        (u.companyId ? null : 'PLATFORM_STAFF') ||
        (selectedBT === 'ALL' ? 'RESTAURANT' : selectedBT);
      return {
        ...u,
        businessType: btCode,
        businessTypeName: resolveBusinessTypeName(btCode, t),
        companyName: u.companyName || company?.name || '',
      };
    });
}

export function buildBusinessTypeList({
  rawBusinessTypes,
  canManagePlatformStaff,
  visitedCounts,
  effectiveBT,
  usersTotalElements,
  isUnfilteredQuery,
  isSearching,
  statsByCode,
  currentLang,
  t,
}) {
  const list = rawBusinessTypes.map((bt) => {
    const fromStats = statsByCode.get(String(bt.code || '').toUpperCase());
    const isSelected = bt.code === effectiveBT;
    const count =
      fromStats?.totalEmployees ??
      (isSelected && isUnfilteredQuery
        ? usersTotalElements
        : (visitedCounts[bt.code] ?? null));
    return {
      code: bt.code,
      name: resolveBusinessTypeName(bt.code, t) || bt.nameUz || bt.name || bt.code,
      totalEmployees: count,
    };
  });

  if (canManagePlatformStaff) {
    const fromStats = statsByCode.get('PLATFORM_STAFF');
    const isSelected = effectiveBT === 'PLATFORM_STAFF';
    const count =
      fromStats?.totalEmployees ??
      (isSelected && isUnfilteredQuery
        ? usersTotalElements
        : (visitedCounts['PLATFORM_STAFF'] ?? null));
    list.push({
      code: 'PLATFORM_STAFF',
      name: resolveBusinessTypeName('PLATFORM_STAFF', t),
      totalEmployees: count,
    });
  }

  if (isSearching) {
    list.unshift({
      code: 'ALL',
      name: currentLang === 'ru' ? 'Все направления' : 'Barcha turlar',
      totalEmployees: usersTotalElements,
    });
  }

  return list;
}
