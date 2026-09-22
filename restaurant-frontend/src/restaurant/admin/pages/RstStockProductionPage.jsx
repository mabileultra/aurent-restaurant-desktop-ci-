import StockProductionPage from '../../../features/reports/pages/StockProductionPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstStockProductionPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_production" subtitleKey="stockProductionHint">
      <StockProductionPage hideTitle />
    </RstStockHubChrome>
  );
}
