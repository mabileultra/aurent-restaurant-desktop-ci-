import { Navigate, Outlet, Route } from 'react-router-dom';
import RestaurantAuthGuard from './RestaurantAuthGuard';
import RestaurantAdminGuard from './RestaurantAdminGuard';
import RestaurantPosGuard from './RestaurantPosGuard';
import RestaurantKitchenGuard from './RestaurantKitchenGuard';
import RestaurantAdminLayout from './RestaurantAdminLayout';
import BillingAccessGuard from '../../router/guards/BillingAccessGuard';
import ProtectedRoute from '../../router/guards/ProtectedRoute';
import { TenantBillingPage } from '../../router/lazyPages';
import HallsAdminPage from '../admin/pages/HallsAdminPage';
import MenuAdminPage from '../admin/pages/MenuAdminPage';
import MenuCategoriesAdminPage from '../admin/pages/MenuCategoriesAdminPage';
import StationsAdminPage from '../admin/pages/StationsAdminPage';
import ModifiersAdminPage from '../admin/pages/ModifiersAdminPage';
import RecipesAdminPage from '../admin/pages/RecipesAdminPage';
import ShiftsAdminPage from '../admin/pages/ShiftsAdminPage';
import BookingAdminPage from '../admin/pages/BookingAdminPage';
import DeliveryAdminPage from '../admin/pages/DeliveryAdminPage';
import DashboardAdminPage from '../admin/pages/DashboardAdminPage';
import ReportsAdminPage from '../admin/pages/ReportsAdminPage';
import ReportsHubAdminPage from '../admin/pages/ReportsHubAdminPage';
import WaiterCommissionReportPage from '../admin/pages/WaiterCommissionReportPage';
import AuditAdminPage from '../admin/pages/AuditAdminPage';
import StaffAdminPage from '../admin/pages/StaffAdminPage';
import StoresAdminPage from '../admin/pages/StoresAdminPage';
import IntegrationsAdminPage from '../admin/pages/IntegrationsAdminPage';
import RstStockFlowScope from '../admin/components/RstStockFlowScope';
import RestaurantFloorPosPage from '../pos/pages/RestaurantFloorPosPage';
import RestaurantCashierPosPage from '../pos/cashier/pages/RestaurantCashierPosPage';
import RestaurantKitchenPage from '../pos/pages/RestaurantKitchenPage';
import RestaurantCashierGuard from './RestaurantCashierGuard';
import RstCatalogProductsPage from '../admin/pages/RstCatalogProductsPage';
import RstCategoriesPage from '../admin/pages/RstCategoriesPage';
import RstWarehouseBalancesPage from '../admin/pages/RstWarehouseBalancesPage';
import RstStockInventoriesPage from '../admin/pages/RstStockInventoriesPage';
import RstStockReceiptsPage from '../admin/pages/RstStockReceiptsPage';
import RstStockReceiptDocumentPage from '../admin/pages/RstStockReceiptDocumentPage';
import RstSuppliersPage from '../admin/pages/RstSuppliersPage';
import RstStockOverviewPage from '../admin/pages/RstStockOverviewPage';
import RstStockWriteOffsPage from '../admin/pages/RstStockWriteOffsPage';
import RstStockExpensesPage from '../admin/pages/RstStockExpensesPage';
import RstStockTransfersPage from '../admin/pages/RstStockTransfersPage';
import RstStockProductionPage from '../admin/pages/RstStockProductionPage';
import RstStockMovementsPage from '../admin/pages/RstStockMovementsPage';
import RestaurantGuidePage from '../admin/pages/RestaurantGuidePage';
import LowStockReportPage from '../../features/reports/pages/LowStockReportPage';

export const restaurantRoutes = (
  <Route
    path="/rst"
    element={(
      <RestaurantAuthGuard>
        <Outlet />
      </RestaurantAuthGuard>
    )}
  >
    <Route index element={<Navigate to="/rst/pos" replace />} />
    <Route
      path="pos"
      element={(
        <RestaurantPosGuard>
          <BillingAccessGuard>
            <RestaurantFloorPosPage />
          </BillingAccessGuard>
        </RestaurantPosGuard>
      )}
    />
    <Route
      path="cashier"
      element={(
        <RestaurantCashierGuard>
          <BillingAccessGuard>
            <RestaurantCashierPosPage />
          </BillingAccessGuard>
        </RestaurantCashierGuard>
      )}
    />
    <Route
      path="kitchen"
      element={(
        <RestaurantKitchenGuard>
          <BillingAccessGuard>
            <RestaurantKitchenPage />
          </BillingAccessGuard>
        </RestaurantKitchenGuard>
      )}
    />
    <Route
      path="admin"
      element={(
        <RestaurantAdminGuard>
          <RestaurantAdminLayout />
        </RestaurantAdminGuard>
      )}
    >
      <Route index element={<Navigate to="/rst/admin/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardAdminPage />} />
      <Route path="halls" element={<HallsAdminPage />} />
      <Route path="menu" element={<MenuAdminPage />} />
      <Route path="menu-categories" element={<MenuCategoriesAdminPage />} />
      <Route path="stations" element={<StationsAdminPage />} />
      <Route path="modifiers" element={<ModifiersAdminPage />} />
      <Route
        path="stock"
        element={(
          <RstStockFlowScope>
            <Outlet />
          </RstStockFlowScope>
        )}
      >
        <Route index element={<RstStockOverviewPage />} />
        <Route path="products" element={<RstCatalogProductsPage />} />
        <Route path="categories" element={<RstCategoriesPage />} />
        <Route path="balances" element={<RstWarehouseBalancesPage />} />
        <Route path="receipts" element={<RstStockReceiptsPage />} />
        <Route path="receipts/new" element={<RstStockReceiptDocumentPage />} />
        <Route path="receipts/:id" element={<RstStockReceiptDocumentPage />} />
        <Route path="expenses" element={<RstStockExpensesPage />} />
        <Route path="transfers" element={<RstStockTransfersPage />} />
        <Route path="production" element={<RstStockProductionPage />} />
        <Route path="write-offs" element={<RstStockWriteOffsPage />} />
        <Route path="inventories" element={<RstStockInventoriesPage />} />
        <Route path="movements" element={<RstStockMovementsPage />} />
        <Route path="suppliers" element={<RstSuppliersPage />} />
        <Route path="inventories/new" element={<Navigate to="/rst/admin/stock/inventories" replace />} />
      </Route>
      <Route path="recipes" element={<RecipesAdminPage />} />
      <Route path="staff" element={<StaffAdminPage />} />
      <Route path="shifts" element={<ShiftsAdminPage />} />
      <Route path="booking" element={<BookingAdminPage />} />
      <Route path="delivery" element={<DeliveryAdminPage />} />
      <Route path="reports" element={<ReportsHubAdminPage />} />
      <Route path="reports/sales" element={<ReportsAdminPage />} />
      <Route path="reports/waiter-commission" element={<WaiterCommissionReportPage />} />
      <Route
        path="reports/inventories"
        element={<Navigate to="/rst/admin/stock/inventories" replace />}
      />
      <Route
        path="reports/balances"
        element={<Navigate to="/rst/admin/stock/balances" replace />}
      />
      <Route
        path="reports/low"
        element={(
          <RstStockFlowScope>
            <LowStockReportPage />
          </RstStockFlowScope>
        )}
      />
      <Route path="audit" element={<AuditAdminPage />} />
      <Route path="guide" element={<RestaurantGuidePage />} />
      <Route
        path="stores"
        element={(
          <ProtectedRoute requiredRole="ADMIN">
            <StoresAdminPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="integrations"
        element={(
          <ProtectedRoute requiredRole="ADMIN">
            <IntegrationsAdminPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="billing"
        element={(
          <ProtectedRoute requiredRole="ADMIN">
            <TenantBillingPage variant="restaurant" />
          </ProtectedRoute>
        )}
      />
    </Route>
  </Route>
);
