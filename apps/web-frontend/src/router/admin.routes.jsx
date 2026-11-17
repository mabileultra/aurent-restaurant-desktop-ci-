import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from './guards/ProtectedRoute';
import AppShellLayout from '../components/layout/AppShellLayout';
import PharmacyOfficeRedirect from './guards/PharmacyOfficeRedirect';
import { adminStockRoutes } from './routes/adminStock.routes';
import { adminReportsRoutes } from './routes/adminReports.routes';
import { adminFinanceRoutes } from './routes/adminFinance.routes';
import { adminSettingsRoutes } from './routes/adminSettings.routes';

export const adminRoutes = (
  <Route
    element={(
      <ProtectedRoute>
        <PharmacyOfficeRedirect>
          <AppShellLayout />
        </PharmacyOfficeRedirect>
      </ProtectedRoute>
    )}
  >
    {adminStockRoutes}
    {adminReportsRoutes}
    {adminFinanceRoutes}
    {adminSettingsRoutes}
  </Route>
);
