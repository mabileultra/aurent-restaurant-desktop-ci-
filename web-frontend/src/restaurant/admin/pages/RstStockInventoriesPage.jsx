import StockInventoriesReportPage from '../../../features/reports/pages/StockInventoriesReportPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstStockInventoriesPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_inventories" subtitleKey="stockInventoriesHint">
      <StockInventoriesReportPage hideTitle />
    </RstStockHubChrome>
  );
}
