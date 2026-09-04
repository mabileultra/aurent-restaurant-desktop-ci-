import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/rst-stock-hub.css';

const TABS = [
  { to: '/rst/admin/stock/products', key: 'products' },
  { to: '/rst/admin/stock/categories', key: 'categories' },
  { to: '/rst/admin/stock/balances', key: 'balances' },
  { to: '/rst/admin/stock/inventories', key: 'inventories' },
  { to: '/rst/admin/stock/receipts', key: 'receipts' },
];

export default function RstStockHubChrome({ children, titleKey = 'stockTitle', subtitleKey = 'stockHubHint' }) {
  const { t } = useTranslation();

  return (
    <div className="rst-stock-hub">
      <div className="rst-stock-hub__head">
        <div>
          <h1 className="rst-coming__title">{t(`rst.admin.${titleKey}`)}</h1>
          <p className="rst-coming__text mb-0">{t(`rst.admin.${subtitleKey}`)}</p>
        </div>
      </div>
      <nav className="rst-stock-hub__tabs" aria-label={t('rst.admin.stockTitle')}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `rst-stock-hub__tab${isActive ? ' is-active' : ''}`}
          >
            {t(`rst.admin.stockTab_${tab.key}`)}
          </NavLink>
        ))}
      </nav>
      <div className="rst-stock-hub__body">
        {children}
      </div>
    </div>
  );
}
