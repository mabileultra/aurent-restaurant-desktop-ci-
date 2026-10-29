import { transliterateCyrillicToLatin } from '../../../../utils/transliterateCyrillic';

const SERVER_SORTS = new Set(['fullName', 'role', 'status', 'createdAt', 'username', 'email']);

export function buildUsersListParams({
  page,
  pageSize,
  search,
  companyId,
  businessType,
  regionCode,
  districtCode,
  roleFilter,
  statusFilter,
  sortField,
  sortDirection,
}) {
  const raw = (search ?? '').trim();
  const latin = raw ? transliterateCyrillicToLatin(raw).trim() : '';
  const params = {
    page,
    size: pageSize,
  };
  if (raw) params.search = raw;
  if (latin && latin.toLowerCase() !== raw.toLowerCase()) params.searchAlt = latin;
  if (companyId) params.companyId = companyId;
  if (businessType) params.businessType = businessType;
  if (regionCode) params.regionCode = regionCode;
  if (districtCode) params.districtCode = districtCode;
  if (roleFilter && roleFilter !== 'ALL') params.role = roleFilter;
  if (statusFilter === 'ACTIVE') params.active = true;
  if (statusFilter === 'INACTIVE') params.active = false;
  const field = SERVER_SORTS.has(sortField) ? sortField : 'fullName';
  const direction = sortDirection === 'desc' ? 'desc' : 'asc';
  params.sort = `${field},${direction}`;
  return params;
}
