import StockMovementsPage from '../../../features/reports/pages/StockMovementsPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstStockMovementsPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_movements" subtitleKey="stockMovementsHint">
      <StockMovementsPage hideTitle />
    </RstStockHubChrome>
  );
}
