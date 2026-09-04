import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ProductsPage from '../../../features/catalog/pages/ProductsPage';
import { useStockFlowPaths } from '../../../features/stock/stockFlowPaths';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';

/** Restaurant OS stock = Aurent products catalog + warehouse doc shortcuts. */
export default function RstCatalogProductsPage() {
  const { t } = useTranslation();
  const paths = useStockFlowPaths();
  const workspace = useRestaurantWorkspaceStore();

  return (
    <div className="rst-catalog-stock space-y-4">
      <div className="rst-catalog-stock__chrome">
        <div>
          <h1 className="rst-coming__title">{t('rst.admin.stockTitle')}</h1>
          <p className="rst-coming__text mb-0">{t('rst.admin.stockCatalogHint')}</p>
        </div>
        <div className="rst-catalog-stock__actions">
          <Link to={paths.inventoriesNew} className="rst-stock-action-btn">
            {t('rst.admin.stockInventory')}
          </Link>
          <Link to={paths.receiptsNew} className="rst-stock-action-btn">
            {t('rst.admin.stockReceipt')}
          </Link>
        </div>
      </div>
      <ProductsPage
        preferredStoreId={workspace.storeId}
        hideTitle
      />
    </div>
  );
}
