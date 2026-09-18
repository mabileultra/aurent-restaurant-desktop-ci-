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

function optionLabel(t, code, types) {
  const normalized = normalizeCode(code);
  const fromApi = types.find((bt) => normalizeCode(bt.code) === normalized);
  if (fromApi?.name) return fromApi.name;
  if (normalized === 'UNIVERSAL') return t('platform.businessTypeChipUniversal');
  return t(`productTemplates.businessTypes.${normalized}`, normalized);
}

export function buildBusinessTypeFilterOptions(t, types = []) {
  const activeTypes = types.filter((bt) => bt && bt.active !== false && bt.code);
  const codes = activeTypes.length
    ? [
        ...CHIP_ORDER.filter((code) => activeTypes.some((bt) => normalizeCode(bt.code) === code)),
        ...activeTypes
          .map((bt) => normalizeCode(bt.code))
          .filter((code) => !CHIP_ORDER.includes(code)),
      ]
    : CHIP_ORDER;

  return [
    { value: '', label: t('platform.filterAllBusinessTypes') },
    ...[...new Set(codes)].map((code) => ({
      value: code,
      label: optionLabel(t, code, activeTypes),
    })),
  ];
}
