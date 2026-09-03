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

function normalizeCode(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw || raw === 'RETAIL') return 'UNIVERSAL';
  return raw;
}

function chipLabel(t, code, types) {
  const normalized = normalizeCode(code);
  const fromApi = types.find((bt) => normalizeCode(bt.code) === normalized);
  if (fromApi?.name) return fromApi.name;
  if (normalized === 'UNIVERSAL') return t('platform.businessTypeChipUniversal');
  return t(`productTemplates.businessTypes.${normalized}`, normalized);
}

export default function BusinessTypeFilterChips({
  types = [],
  value = '',
  onChange,
}) {
  const { t } = useTranslation();
  const activeTypes = types.filter((bt) => bt && bt.active !== false && bt.code);

  const codes = activeTypes.length
    ? [
        ...CHIP_ORDER.filter((code) =>
          activeTypes.some((bt) => normalizeCode(bt.code) === code)
        ),
        ...activeTypes
          .map((bt) => normalizeCode(bt.code))
          .filter((code) => !CHIP_ORDER.includes(code)),
      ]
    : CHIP_ORDER;

  const uniqueCodes = [...new Set(codes)];
  const current = value ? normalizeCode(value) : '';

  return (
    <div className="business-type-filters" role="group" aria-label={t('platform.filterBusinessType')}>
      <button
        type="button"
        className={`business-type-filters__chip${!current ? ' is-active' : ''}`}
        onClick={() => onChange('')}
      >
        {t('platform.filterAllBusinessTypes')}
      </button>
      {uniqueCodes.map((code) => (
        <button
          key={code}
          type="button"
          className={`business-type-filters__chip${current === code ? ' is-active' : ''}`}
          onClick={() => onChange(code === current ? '' : code)}
        >
          {chipLabel(t, code, activeTypes)}
        </button>
      ))}
    </div>
  );
}
