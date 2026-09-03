import { BaseSelect } from '../../../../components/ui';

function companyOptionLabel(t, company) {
  const code = String(company?.businessType || 'UNIVERSAL').trim().toUpperCase();
  const normalized = !code || code === 'RETAIL' ? 'UNIVERSAL' : code;
  const typeLabel = t(`productTemplates.businessTypes.${normalized}`, normalized);
  return `${company.name} · ${typeLabel}`;
}

export default function PlatformModuleAccessCompanySelect({ t, companies, companyId, onChange }) {
  return (
    <BaseSelect
      className="module-access-toolbar__company"
      size="sm"
      label={t('platform.moduleAccess.company')}
      value={companyId}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('platform.moduleAccess.allCompanies')}
      options={[
        { value: '', label: t('platform.moduleAccess.allCompanies') },
        ...companies
          .slice()
          .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }))
          .map((c) => ({ value: String(c.id), label: companyOptionLabel(t, c) })),
      ]}
    />
  );
}
