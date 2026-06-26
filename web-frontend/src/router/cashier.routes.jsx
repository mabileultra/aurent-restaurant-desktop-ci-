import { Route, Navigate } from 'react-router-dom';
import CashierRoute from './guards/CashierRoute';
import CashierHomeRedirect from './guards/CashierHomeRedirect';
import CashierRetailPosGuard from './guards/CashierRetailPosGuard';
import CashierLayout from '../components/layout/CashierLayout';
import {
  PosPage,
  RestaurantPosPage,
  KitchenDisplayPage,
  CashierMySalesPage,
  HandbookPage,
  SupportPage,
} from './lazyPages';

export const cashierRoutes = (
  <Route
    path="/cashier"
    element={(
      <CashierRoute>
        <CashierLayout />
      </CashierRoute>
    )}
  >
    <Route index element={<CashierHomeRedirect />} />
    <Route
      path="pos"
      element={(
        <CashierRetailPosGuard>
          <PosPage />
        </CashierRetailPosGuard>
      )}
    />
    <Route path="restaurant" element={<RestaurantPosPage />} />
    <Route path="kitchen" element={<KitchenDisplayPage />} />
    <Route path="sales" element={<CashierMySalesPage />} />
    <Route path="handbook" element={<HandbookPage scope="cashier" />} />
    <Route path="handbook/:moduleId" element={<HandbookPage scope="cashier" />} />
    <Route path="support" element={<SupportPage />} />
  </Route>
);
