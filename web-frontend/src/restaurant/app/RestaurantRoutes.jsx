import { Navigate, Outlet, Route } from 'react-router-dom';
import RestaurantAuthGuard from './RestaurantAuthGuard';
import RestaurantAdminGuard from './RestaurantAdminGuard';
import RestaurantPosGuard from './RestaurantPosGuard';
import RestaurantKitchenGuard from './RestaurantKitchenGuard';
import RestaurantAdminLayout from './RestaurantAdminLayout';
import HallsAdminPage from '../admin/pages/HallsAdminPage';
import MenuAdminPage from '../admin/pages/MenuAdminPage';
import StationsAdminPage from '../admin/pages/StationsAdminPage';
import ModifiersAdminPage from '../admin/pages/ModifiersAdminPage';
import RecipesAdminPage from '../admin/pages/RecipesAdminPage';
import StockAdminPage from '../admin/pages/StockAdminPage';
import ShiftsAdminPage from '../admin/pages/ShiftsAdminPage';
import BookingAdminPage from '../admin/pages/BookingAdminPage';
import DeliveryAdminPage from '../admin/pages/DeliveryAdminPage';
import DashboardAdminPage from '../admin/pages/DashboardAdminPage';
import ReportsAdminPage from '../admin/pages/ReportsAdminPage';
import AuditAdminPage from '../admin/pages/AuditAdminPage';
import StaffAdminPage from '../admin/pages/StaffAdminPage';
import RestaurantFloorPosPage from '../pos/pages/RestaurantFloorPosPage';
import RestaurantKitchenPage from '../pos/pages/RestaurantKitchenPage';

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
          <RestaurantFloorPosPage />
        </RestaurantPosGuard>
      )}
    />
    <Route
      path="kitchen"
      element={(
        <RestaurantKitchenGuard>
          <RestaurantKitchenPage />
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
      <Route path="stations" element={<StationsAdminPage />} />
      <Route path="modifiers" element={<ModifiersAdminPage />} />
      <Route path="stock" element={<StockAdminPage />} />
      <Route path="recipes" element={<RecipesAdminPage />} />
      <Route path="staff" element={<StaffAdminPage />} />
      <Route path="shifts" element={<ShiftsAdminPage />} />
      <Route path="booking" element={<BookingAdminPage />} />
      <Route path="delivery" element={<DeliveryAdminPage />} />
      <Route path="reports" element={<ReportsAdminPage />} />
      <Route path="audit" element={<AuditAdminPage />} />
    </Route>
  </Route>
);
