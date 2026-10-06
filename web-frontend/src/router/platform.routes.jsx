import { Route } from 'react-router-dom';
import SuperAdminRoute from './guards/SuperAdminRoute';
import PlatformPageGuard from './guards/PlatformPageGuard';
import PlatformHomeRedirect from './guards/PlatformHomeRedirect';
import SuperAdminLayout from '../components/layout/SuperAdminLayout';
import {
  PlatformCompaniesPage,
  PlatformStoresPage,
  PlatformUsersPage,
  PlatformModuleAccessPage,
  PlatformMonitoringPage,
  PlatformEmailPage,
  PlatformDesktopNotificationsPage,
  PlatformSecurityPage,
  PlatformAccountPage,
  PlatformBusinessTypesPage,
  PlatformReferenceBooksPage,
  PlatformLeadsPage,
  PlatformBillingPage,
  PlatformAnalyticsPage,
} from './lazyPages';

function guarded(page) {
  return <PlatformPageGuard>{page}</PlatformPageGuard>;
}

export const platformRoutes = (
  <Route
    path="/platform"
    element={(
      <SuperAdminRoute>
        <SuperAdminLayout />
      </SuperAdminRoute>
    )}
  >
    <Route index element={<PlatformHomeRedirect />} />
    <Route path="companies" element={guarded(<PlatformCompaniesPage />)} />
    <Route path="stores" element={guarded(<PlatformStoresPage />)} />
    <Route path="users" element={guarded(<PlatformUsersPage />)} />
    <Route path="access" element={guarded(<PlatformModuleAccessPage />)} />
    <Route path="monitoring" element={guarded(<PlatformMonitoringPage />)} />
    <Route path="email" element={guarded(<PlatformEmailPage />)} />
    <Route path="desktop-notifications" element={guarded(<PlatformDesktopNotificationsPage />)} />
    <Route path="security" element={guarded(<PlatformSecurityPage />)} />
    <Route path="account" element={guarded(<PlatformAccountPage />)} />
    <Route path="business-types" element={guarded(<PlatformBusinessTypesPage />)} />
    <Route path="reference-books" element={guarded(<PlatformReferenceBooksPage />)} />
    <Route path="leads" element={guarded(<PlatformLeadsPage />)} />
    <Route path="billing" element={guarded(<PlatformBillingPage />)} />
    <Route path="analytics/*" element={guarded(<PlatformAnalyticsPage />)} />
  </Route>
);
