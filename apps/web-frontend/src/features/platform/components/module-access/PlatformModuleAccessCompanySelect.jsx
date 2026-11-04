import { BaseSelect } from '../../../../components/ui';
import { buildCompanySelectOptions } from '../../../tenant/utils/companySelectOptions';
import { MODULE_ACCESS_PLATFORM_FILTER } from '../../constants';

function companyOptionLabel(t, company) {
  const code = String(company?.businessType || 'UNIVERSAL').trim().toUpperCase();
  const normalized = !code || code === 'RETAIL' ? 'UNIVERSAL' : code;
  const typeLabel = t(`productTemplates.businessTypes.${normalized}`, normalized);
  const name = company.name || `#${company.id}`;
  const login = company.loginCode ? String(company.loginCode) : '';
  const withCode = login ? `${name} (${login})` : name;
  return `${withCode} · ${typeLabel}`;
}

export default function PlatformModuleAccessCompanySelect({
  t,
  companies,
  companyId,
  onChange,
  onSearchQueryChange,
  includePlatformStaff = true,
}) {
  const companyOptions = buildCompanySelectOptions(companies, {
    emptyLabel: t('platform.moduleAccess.allCompanies'),
    includeLoginCode: true,
  }).map((option) => {
    if (!option.value) return option;
    const company = companies.find((c) => String(c.id) === String(option.value));
    if (!company) return option;
    return {
      ...option,
      label: companyOptionLabel(t, company),
      keywords: [company.name, company.loginCode, companyOptionLabel(t, company)]
        .filter(Boolean)
        .join(' '),
    };
  });

  const options = includePlatformStaff
    ? [
        companyOptions[0],
        { value: MODULE_ACCESS_PLATFORM_FILTER, label: t('platform.moduleAccess.platformStaff') },
        ...companyOptions.slice(1),
      ]
    : companyOptions;

  return (
    <BaseSelect
      className="module-access-toolbar__company"
      size="sm"
      label={t('platform.moduleAccess.company')}
      value={companyId}
      onChange={(e) => onChange(e.target.value)}
      onSearchQueryChange={onSearchQueryChange}
      placeholder={t('platform.moduleAccess.allCompanies')}
      searchPlaceholder={t('stores.searchCompany', { defaultValue: 'Поиск компании…' })}
      options={options}
    />
  );
}
