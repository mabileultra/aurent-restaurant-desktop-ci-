/** In-app restaurant operations guide — section ids + i18n key map. */

export const GUIDE_SECTIONS = [
  { id: 'start', icon: 'ListOrdered' },
  { id: 'rules', icon: 'ShieldCheck' },
  { id: 'roles', icon: 'Users' },
  { id: 'hall', icon: 'LayoutGrid' },
  { id: 'references', icon: 'Library' },
  { id: 'menu', icon: 'UtensilsCrossed' },
  { id: 'stock', icon: 'Warehouse' },
  { id: 'waiter', icon: 'ClipboardList' },
  { id: 'cashier', icon: 'CreditCard' },
  { id: 'kitchen', icon: 'ChefHat' },
  { id: 'shifts', icon: 'Clock' },
  { id: 'booking', icon: 'CalendarDays' },
  { id: 'day', icon: 'Sun' },
];

export function guideTitleKey(id) {
  return `rst.guide.sections.${id}.title`;
}

export function guideLeadKey(id) {
  return `rst.guide.sections.${id}.lead`;
}

export function guideStepsKey(id) {
  return `rst.guide.sections.${id}.steps`;
}

export function guideNotesKey(id) {
  return `rst.guide.sections.${id}.notes`;
}
