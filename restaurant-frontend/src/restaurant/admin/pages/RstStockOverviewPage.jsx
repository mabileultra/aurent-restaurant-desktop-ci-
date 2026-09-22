import StockOverviewPage from '../../../features/reports/pages/StockOverviewPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstStockOverviewPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_overview" subtitleKey="stockOverviewHint">
      <StockOverviewPage hideTitle />
    </RstStockHubChrome>
  );
}
