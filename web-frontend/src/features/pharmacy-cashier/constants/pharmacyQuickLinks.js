/** Быстрые ссылки аптечной кассы (конфиг кнопок тулбара). */

export const PHARMACY_QUICK_LINK_IDS = {
  ADMIN: 'admin',
  DMED: 'dmed',
  IKPU: 'ikpu',
  ANALOGS: 'analogs',
  ASL_PORTAL: 'asl_portal',
  MYGOV: 'mygov',
};

export const PHARMACY_EXTERNAL_URLS = {
  dmed: 'https://dmed.uz/uz',
  ikpu: 'https://tasnif.soliq.uz/',
  aslPortal: 'https://xtrace.aslbelgisi.uz',
  mygov: 'https://my.gov.uz/',
};

/** Основные кнопки рядом с поиском */
export const PHARMACY_TOOLBAR_LINKS = [
  { id: PHARMACY_QUICK_LINK_IDS.DMED, kind: 'dmed', requiresDmed: true },
  { id: PHARMACY_QUICK_LINK_IDS.IKPU, kind: 'external', urlKey: 'ikpu' },
];

/** Пункты выпадающего меню «⋯» */
export const PHARMACY_MORE_LINKS = [
  { id: PHARMACY_QUICK_LINK_IDS.ANALOGS, kind: 'analogs' },
  { id: PHARMACY_QUICK_LINK_IDS.ASL_PORTAL, kind: 'external', urlKey: 'aslPortal' },
  { id: PHARMACY_QUICK_LINK_IDS.MYGOV, kind: 'external', urlKey: 'mygov' },
];
