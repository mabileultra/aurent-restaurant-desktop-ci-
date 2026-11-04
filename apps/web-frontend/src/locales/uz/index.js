import ai from './ai.json';
import auth from './auth.json';
import billing from './billing.json';
import cashRegisters from './cashRegisters.json';
import catalog from './catalog.json';
import common from './common.json';
import desktop from './desktop.json';
import finance from './finance.json';
import handbook from './handbook.json';
import pharmacy from './pharmacy.json';
import platform from './platform.json';
import pos from './pos.json';
import publicSite from './publicSite.json';
import reports from './reports.json';
import restaurant from './restaurant.json';
import stock from './stock.json';
import tenant from './tenant.json';

const uz = {
  ...common,
  ...platform,
  ...pos,
  ...restaurant,
  ...pharmacy,
  ...catalog,
  ...stock,
  ...finance,
  ...billing,
  ...tenant,
  ...cashRegisters,
  ...reports,
  ...desktop,
  ...handbook,
  ...auth,
  ...ai,
  ...publicSite,
};

export default uz;
