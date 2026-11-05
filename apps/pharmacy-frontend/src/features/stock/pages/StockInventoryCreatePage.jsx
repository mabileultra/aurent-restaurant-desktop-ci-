import { useStockInventoryCreatePage } from '../hooks/useStockInventoryCreatePage';
import { useStockFlowPaths } from '../stockFlowPaths';
import StockInventoryWorkspace from '../components/inventory/StockInventoryWorkspace';

export default function StockInventoryCreatePage() {
  const model = useStockInventoryCreatePage();
  const paths = useStockFlowPaths();
  return <StockInventoryWorkspace model={model} paths={paths} />;
}
