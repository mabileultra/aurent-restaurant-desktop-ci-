import SuppliersPage from '../../../features/catalog/pages/SuppliersPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstSuppliersPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_suppliers" subtitleKey="stockSuppliersHint">
      <SuppliersPage hideTitle />
    </RstStockHubChrome>
  );
}
