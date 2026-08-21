import { BaseSelect } from '../../../../components/ui';

export default function StoresCompanyFilter({ t, companies = [], companyId, onChange }) {
  const options = [
    { value: '', label: t('stores.allCompanies') },
    ...companies
      .slice()
      .sort((a, b) =>
        String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
      )
      .map((company) => ({ value: String(company.id), label: company.name })),
  ];

  return (
    <BaseSelect
      className="stores-filters__company"
      size="sm"
      label={t('stores.colCompany')}
      value={companyId}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('stores.allCompanies')}
      options={options}
    />
  );
}
