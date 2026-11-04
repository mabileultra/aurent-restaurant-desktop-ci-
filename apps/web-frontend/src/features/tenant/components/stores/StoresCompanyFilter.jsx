import { BaseSelect } from '../../../../components/ui';
import { buildCompanySelectOptions } from '../../utils/companySelectOptions';

export default function StoresCompanyFilter({ t, companies = [], companyId, onChange }) {
  return (
    <BaseSelect
      className="stores-filters__company"
      size="sm"
      label={t('stores.colCompany')}
      value={companyId}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('stores.allCompanies')}
      searchPlaceholder={t('stores.searchCompany', { defaultValue: 'Поиск компании…' })}
      options={buildCompanySelectOptions(companies, { emptyLabel: t('stores.allCompanies') })}
    />
  );
}
