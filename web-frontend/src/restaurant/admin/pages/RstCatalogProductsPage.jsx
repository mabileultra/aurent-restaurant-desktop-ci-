import ProductsPage from '../../../features/catalog/pages/ProductsPage';
import { useRestaurantWorkspaceStore } from '../../shared/hooks/useRestaurantWorkspaceStore';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstCatalogProductsPage() {
  const workspace = useRestaurantWorkspaceStore();

  return (
    <RstStockHubChrome titleKey="stockTab_products" subtitleKey="stockProductsHint">
      <ProductsPage
        preferredStoreId={workspace.storeId}
        hideTitle
      />
    </RstStockHubChrome>
  );
}
