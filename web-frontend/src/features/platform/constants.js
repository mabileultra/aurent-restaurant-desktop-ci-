export const MODULE_ACCESS_GROUP_ORDER = [
  'main',
  'goods',
  'stock',
  'orders',
  'finance',
  'registers',
  'reportsSales',
  'reportsStock',
  'restaurant',
  'settings',
  'cashier',
];

export const MODULE_ACCESS_USER_FILTERS = ['all', 'new', 'unconfigured', 'custom'];

export const MODULE_ACCESS_USER_FILTER_LABELS = {
  all: 'platform.moduleAccess.filterAll',
  new: 'platform.moduleAccess.filterNew',
  unconfigured: 'platform.moduleAccess.filterUnconfigured',
  custom: 'platform.moduleAccess.filterCustom',
};

export const MODULE_ACCESS_NEW_USER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
