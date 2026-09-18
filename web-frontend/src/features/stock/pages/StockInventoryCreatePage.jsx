import { useStockInventoryCreatePage } from '../hooks/useStockInventoryCreatePage';
import { useStockFlowPaths } from '../stockFlowPaths';
import StockInventoryWorkspace from '../components/inventory/StockInventoryWorkspace';
import StockInventoryCreateLegacy from './StockInventoryCreateLegacy';

function isRestaurantStockFlow(paths) {
  return String(paths.inventoriesNew || '').startsWith('/rst');
}

export default function StockInventoryCreatePage() {
  const model = useStockInventoryCreatePage();
  const paths = useStockFlowPaths();
  if (isRestaurantStockFlow(paths)) {
    return <StockInventoryCreateLegacy model={model} paths={paths} />;
  }
  return <StockInventoryWorkspace model={model} paths={paths} />;
}
