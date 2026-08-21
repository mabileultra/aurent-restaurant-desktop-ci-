import { useTranslation } from 'react-i18next';
import '../../../styles/platform/business-type-filters.css';

const CHIP_ORDER = [
  'PHARMACY',
  'RESTAURANT',
  'GROCERY',
  'CANTEEN',
  'CLOTHING',
  'CONSTRUCTION',
  'AUTO_PARTS',
  'UNIVERSAL',
  'OTHER',
];

function chipLabel(t, code) {
  if (code === 'UNIVERSAL') return t('platform.businessTypeChipUniversal');
  return t(`productTemplates.businessTypes.${code}`, code);
}

export default function BusinessTypeFilterChips({
  types = [],
  value = '',
  onChange,
}) {
  const { t } = useTranslation();

  const codes = types.length
    ? [
        ...CHIP_ORDER.filter((code) => types.some((bt) => bt.code === code)),
        ...types.map((bt) => bt.code).filter((code) => !CHIP_ORDER.includes(code)),
      ]
    : CHIP_ORDER;

  return (
    <div className="business-type-filters" role="group" aria-label={t('platform.filterBusinessType')}>
      <button
        type="button"
        className={`business-type-filters__chip${!value ? ' is-active' : ''}`}
        onClick={() => onChange('')}
      >
        {t('platform.filterAllBusinessTypes')}
      </button>
      {codes.map((code) => (
        <button
          key={code}
          type="button"
          className={`business-type-filters__chip${value === code ? ' is-active' : ''}`}
          onClick={() => onChange(code === value ? '' : code)}
        >
          {chipLabel(t, code)}
        </button>
      ))}
    </div>
  );
}
