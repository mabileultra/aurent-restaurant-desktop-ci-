import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import {
  CashRegisterConfigPage,
  CashRegistersListPage,
  CashRegisterTransferPage,
  HandbookPage,
  StoresPage,
  SupportPage,
  TenantBillingPage,
  UsersBarcodePrintPage,
  UsersBrandingSettingsPage,
  UsersPage,
  UsersPrinterSettingsPage,
  ZReportsPage,
} from '../lazyPages';

export const adminSettingsRoutes = (
  <>
    <Route
      path="cash-registers/list"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="registersList">
          <CashRegistersListPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="cash-registers/z-reports"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="registersZReports">
          <ZReportsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="cash-registers/transfer"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="registersTransfer">
          <CashRegisterTransferPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="cash-registers/config"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="registersConfig">
          <CashRegisterConfigPage />
        </ProtectedRoute>
      )}
    />
    <Route path="cash-registers" element={<Navigate to="/cash-registers/list" replace />} />
    <Route path="restaurant/hall" element={<Navigate to="/dashboard" replace />} />
    <Route path="restaurant/floor" element={<Navigate to="/dashboard" replace />} />
    <Route path="restaurant/kitchen" element={<Navigate to="/dashboard" replace />} />
    <Route path="restaurant/booking" element={<Navigate to="/dashboard" replace />} />
    <Route path="restaurant/delivery" element={<Navigate to="/dashboard" replace />} />
    <Route path="restaurant" element={<Navigate to="/dashboard" replace />} />
    <Route
      path="billing"
      element={(
        <ProtectedRoute requiredRole="ADMIN">
          <TenantBillingPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="stores"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="stores">
          <StoresPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="users/list"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="usersList">
          <UsersPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="users/printer-settings"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="usersPrinterSettings">
          <UsersPrinterSettingsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="users/branding-settings"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="usersBrandingSettings">
          <UsersBrandingSettingsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="users/barcode-print"
      element={(
        <ProtectedRoute module="usersBarcodePrint">
          <UsersBarcodePrintPage />
        </ProtectedRoute>
      )}
    />
    <Route path="users" element={<Navigate to="/users/list" replace />} />
    <Route path="handbook" element={<HandbookPage scope="admin" />} />
    <Route path="handbook/:moduleId" element={<HandbookPage scope="admin" />} />
    <Route path="support" element={<SupportPage />} />
  </>
);
