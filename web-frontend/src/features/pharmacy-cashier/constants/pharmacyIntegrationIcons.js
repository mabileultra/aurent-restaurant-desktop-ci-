import { PHARMACY_QUICK_LINK_IDS } from './pharmacyQuickLinks';

const BASE = '/cashier/pharmacy-integrations';

export const PHARMACY_INTEGRATION_ICONS = {
  [PHARMACY_QUICK_LINK_IDS.ADMIN]: `${BASE}/chrome.png`,
  [PHARMACY_QUICK_LINK_IDS.DMED]: `${BASE}/dmed.png`,
  [PHARMACY_QUICK_LINK_IDS.MARKING]: `${BASE}/asl-belgisi.png`,
  [PHARMACY_QUICK_LINK_IDS.IKPU]: `${BASE}/ikpu.svg`,
  [PHARMACY_QUICK_LINK_IDS.ANALOGS]: `${BASE}/analogs.svg`,
  [PHARMACY_QUICK_LINK_IDS.ASL_PORTAL]: `${BASE}/asl-belgisi.png`,
  [PHARMACY_QUICK_LINK_IDS.MYGOV]: `${BASE}/mygov.svg`,
};
