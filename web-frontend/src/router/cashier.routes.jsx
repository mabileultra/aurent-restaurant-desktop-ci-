import { Route, Navigate } from 'react-router-dom';
import CashierRoute from './guards/CashierRoute';
import CashierHomeRedirect from './guards/CashierHomeRedirect';
import CashierRetailPosGuard from './guards/CashierRetailPosGuard';
import CashierPharmacyPosGuard from './guards/CashierPharmacyPosGuard';
import CashierLayout from '../components/layout/CashierLayout';
import {
  PosPage,
  PharmacyPosPage,
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
    <Route path="restaurant" element={<Navigate to="/rst/pos" replace />} />
    <Route
      path="pharmacy"
      element={(
        <CashierPharmacyPosGuard>
          <PharmacyPosPage />
        </CashierPharmacyPosGuard>
      )}
    />
    <Route path="kitchen" element={<Navigate to="/rst/kitchen" replace />} />
    <Route path="sales" element={<CashierMySalesPage />} />
    <Route path="handbook" element={<HandbookPage scope="cashier" />} />
    <Route path="handbook/:moduleId" element={<HandbookPage scope="cashier" />} />
    <Route path="support" element={<SupportPage />} />
  </Route>
);
