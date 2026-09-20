import { StockFlowPathsProvider, RST_STOCK_FLOW_PATHS } from '../../../features/stock/stockFlowPaths';
import '../styles/analytics-admin.css';
import '../styles/rst-embedded-stock.css';

/** Mounts shared warehouse/report pages under Restaurant OS without leaving the shell. */
export default function RstStockFlowScope({ children }) {
  return (
    <StockFlowPathsProvider value={RST_STOCK_FLOW_PATHS}>
      <div className="rst-embedded-stock">
        {children}
      </div>
    </StockFlowPathsProvider>
  );
}
