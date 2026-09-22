import StockExpensesReportPage from '../../../features/reports/pages/StockExpensesReportPage';
import RstStockHubChrome from '../components/RstStockHubChrome';

export default function RstStockExpensesPage() {
  return (
    <RstStockHubChrome titleKey="stockTab_expenses" subtitleKey="stockExpensesHint">
      <StockExpensesReportPage hideTitle />
    </RstStockHubChrome>
  );
}
