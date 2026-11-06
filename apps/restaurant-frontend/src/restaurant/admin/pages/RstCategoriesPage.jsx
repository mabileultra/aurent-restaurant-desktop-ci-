import CategoriesPage from '../../../features/catalog/pages/CategoriesPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstCategoriesPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_categories" subtitleKey="stockCategoriesHint">
      <CategoriesPage hideTitle />
    </RstStockHubChrome>
  );
}
