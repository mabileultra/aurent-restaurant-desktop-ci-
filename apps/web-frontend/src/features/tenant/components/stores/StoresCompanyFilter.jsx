import { BaseSelect } from '../../../../components/ui';
import { useCompanySearchOptions } from '../../hooks/useCompanySearchOptions';

export default function StoresCompanyFilter({
  t,
  companies = [],
  companyId,
  onChange,
  variant = 'default',
  size = 'sm',
}) {
  const companySearch = useCompanySearchOptions({
    initialCompanies: companies,
    selectedCompanyId: companyId,
    emptyLabel: t('stores.allCompanies'),
  });

  return (
    <BaseSelect
      className="stores-filters__company"
      menuClassName="min-w-[280px] max-w-[440px]"
      menuMinWidth={280}
      variant={variant}
      size={size}
      label={t('stores.colCompany')}
      value={companyId}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('stores.allCompanies')}
      searchPlaceholder={t('stores.searchCompany', { defaultValue: 'Поиск компании…' })}
      options={companySearch.options}
      onSearchQueryChange={companySearch.onSearchQueryChange}
    />
  );
}
