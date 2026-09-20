import StockProductsPage from '../../../features/stock/pages/StockProductsPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstWarehouseBalancesPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_balances" subtitleKey="stockBalancesHint">
      <StockProductsPage embeddedInRstHub />
    </RstStockHubChrome>
  );
}
