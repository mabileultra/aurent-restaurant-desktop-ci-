/** Keep in sync with StorePrintProfileDefaults.java — empty/default = today's slips. */

export const PRINT_SLIP_TYPES = ['CANCEL', 'GUEST_BILL', 'KITCHEN', 'SHIFT_ITEMS', 'PICKUP_LABEL'];

export const PRINT_FIELD_KEYS = [
  'logo',
  'storeName',
  'address',
  'phone',
  'headerTitle',
  'hallTable',
  'waiter',
  'time',
  'items',
  'totals',
  'footer',
];

export const PRINT_FONT_OPTIONS = [
  { id: 'monospace', css: 'ui-monospace, Menlo, Consolas, monospace', labelKey: 'rst.admin.printFontMono' },
  { id: 'times', css: '"Times New Roman", Times, serif', labelKey: 'rst.admin.printFontTimes' },
  { id: 'georgia', css: 'Georgia, serif', labelKey: 'rst.admin.printFontGeorgia' },
  { id: 'arial', css: 'Arial, Helvetica, sans-serif', labelKey: 'rst.admin.printFontArial' },
  { id: 'courier', css: '"Courier New", Courier, monospace', labelKey: 'rst.admin.printFontCourier' },
];

export const PRINT_SIZE_OPTIONS = [
  { id: 'sm', labelKey: 'rst.admin.printSizeSm' },
  { id: 'md', labelKey: 'rst.admin.printSizeMd' },
  { id: 'lg', labelKey: 'rst.admin.printSizeLg' },
];

function defaultField(slip, key) {
  const cancelEmph = slip === 'CANCEL' && (key === 'headerTitle' || key === 'items');
  const pickup = slip === 'PICKUP_LABEL';
  const pickupTitle = pickup && key === 'headerTitle';
  let on = true;
  if (key === 'logo' || key === 'storeName' || key === 'address' || key === 'phone' || key === 'footer') {
    on = false;
  }
  if (key === 'totals') on = slip === 'GUEST_BILL' || slip === 'SHIFT_ITEMS';
  if (pickup && key === 'waiter') on = false;
  return {
    on,
    bold: cancelEmph || key === 'headerTitle',
    size: cancelEmph || pickupTitle ? 'lg' : 'md',
    font: 'inherit',
  };
}

function defaultSlip(slip) {
  const fields = {};
  for (const key of PRINT_FIELD_KEYS) fields[key] = defaultField(slip, key);
  return { fields };
}

export function factoryPrintProfile() {
  const slips = {};
  for (const slip of PRINT_SLIP_TYPES) slips[slip] = defaultSlip(slip);
  return {
    logoDataUrl: '',
    logoMaxHeightMm: 22,
    storeName: '',
    address: '',
    phone: '',
    footer: '',
    defaultFont: 'monospace',
    slips,
  };
}

export function fontCss(fontId, defaultFont = 'monospace') {
  const id = fontId && fontId !== 'inherit' ? fontId : defaultFont;
  return PRINT_FONT_OPTIONS.find((f) => f.id === id)?.css
    || PRINT_FONT_OPTIONS[0].css;
}

export function fieldStyle(profile, slipType, fieldKey) {
  const slip = profile?.slips?.[slipType]?.fields?.[fieldKey];
  if (!slip) return defaultField(slipType, fieldKey);
  return {
    on: slip.on !== false,
    bold: Boolean(slip.bold),
    size: ['sm', 'md', 'lg'].includes(slip.size) ? slip.size : 'md',
    font: slip.font || 'inherit',
  };
}
