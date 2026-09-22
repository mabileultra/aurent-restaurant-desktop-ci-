import StockWriteOffsReportPage from '../../../features/reports/pages/StockWriteOffsReportPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstStockWriteOffsPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_writeOffs" subtitleKey="stockWriteOffsHint">
      <StockWriteOffsReportPage hideTitle />
    </RstStockHubChrome>
  );
}
