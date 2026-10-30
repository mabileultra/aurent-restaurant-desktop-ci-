const TABS = [
  {
    id: 'devices',
    labelKey: 'rst.admin.printersTabDevices',
    defaultValue: 'Принтеры',
  },
  {
    id: 'companyReceipt',
    labelKey: 'rst.admin.printersTabCompanyReceipt',
    defaultValue: 'Чек компании',
  },
  {
    id: 'slipDesign',
    labelKey: 'rst.admin.printersTabSlipDesign',
    defaultValue: 'Слипы и смена',
  },
];

export default function PrintersAdminNav({ active, onChange, t }) {
  return (
    <nav className="rst-printers-nav" aria-label={t('rst.admin.printersTitle')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`rst-printers-nav__btn${active === tab.id ? ' is-active' : ''}`}
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onChange(tab.id)}
        >
          {t(tab.labelKey, { defaultValue: tab.defaultValue })}
        </button>
      ))}
    </nav>
  );
}

export const PRINTERS_ADMIN_TABS = TABS;
