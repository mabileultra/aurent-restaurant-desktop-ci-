import { companyApi } from '../../../api';

/** Capped options page for selects — never call /companies/all from UI lists. */
export const COMPANIES_OPTIONS_PAGE_SIZE = 300;

export async function loadCompaniesOptionsPage({
  businessType,
  search,
  page = 0,
  size = COMPANIES_OPTIONS_PAGE_SIZE,
} = {}) {
  const { data } = await companyApi.getAll({
    page,
    size,
    businessType: businessType || undefined,
    search: search?.trim() || undefined,
  });
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.content) ? data.content : [];
}
