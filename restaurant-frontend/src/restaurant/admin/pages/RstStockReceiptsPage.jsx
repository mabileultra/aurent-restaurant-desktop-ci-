import StockReceiptsReportPage from '../../../features/reports/pages/StockReceiptsReportPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstStockReceiptsPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_receipts" subtitleKey="stockReceiptsHint">
      <StockReceiptsReportPage hideTitle />
    </RstStockHubChrome>
  );
}
