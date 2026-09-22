import StockTransfersReportPage from '../../../features/reports/pages/StockTransfersReportPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstStockTransfersPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_transfers" subtitleKey="stockTransfersHint">
      <StockTransfersReportPage hideTitle />
    </RstStockHubChrome>
  );
}
