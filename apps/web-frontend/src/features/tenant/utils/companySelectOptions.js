/** Нормализация списка из API (массив или page.content). */
export function asEntityList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/** Опции BaseSelect для компаний: сортировка + поиск по имени/коду. */
export function buildCompanySelectOptions(companies = [], { emptyLabel, includeLoginCode = true } = {}) {
  const sorted = companies
    .slice()
    .filter((c) => c?.id != null)
    .sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
    );

  const options = sorted.map((company) => {
    const name = company.name || `#${company.id}`;
    const code = company.loginCode ? String(company.loginCode) : '';
    return {
      value: String(company.id),
      label: includeLoginCode && code ? `${name} (${code})` : name,
      keywords: [name, code, company.legalName, company.tin].filter(Boolean).join(' '),
    };
  });

  if (emptyLabel != null) {
    return [{ value: '', label: emptyLabel }, ...options];
  }
  return options;
}
