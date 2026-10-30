import { Route } from 'react-router-dom';
import SuperAdminRoute from './guards/SuperAdminRoute';
import PlatformPageGuard from './guards/PlatformPageGuard';
import PlatformHomeRedirect from './guards/PlatformHomeRedirect';
import SuperAdminLayout from '../components/layout/SuperAdminLayout';
import SectionErrorBoundary from '../components/shared/SectionErrorBoundary';
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
  PlatformCompanyAnalyticsPage,
  PlatformCompanyAnalyticsDetailPage,
} from './lazyPages';

function guarded(page, sectionName) {
  return (
    <PlatformPageGuard>
      <SectionErrorBoundary sectionName={sectionName || 'platform-page'}>
        {page}
      </SectionErrorBoundary>
    </PlatformPageGuard>
  );
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
    <Route path="companies" element={guarded(<PlatformCompaniesPage />, 'platform-companies')} />
    <Route path="stores" element={guarded(<PlatformStoresPage />, 'platform-stores')} />
    <Route path="users" element={guarded(<PlatformUsersPage />, 'platform-users')} />
    <Route path="access" element={guarded(<PlatformModuleAccessPage />, 'platform-access')} />
    <Route path="monitoring" element={guarded(<PlatformMonitoringPage />, 'platform-monitoring')} />
    <Route path="email" element={guarded(<PlatformEmailPage />, 'platform-email')} />
    <Route path="desktop-notifications" element={guarded(<PlatformDesktopNotificationsPage />, 'platform-desktop-notifications')} />
    <Route path="security" element={guarded(<PlatformSecurityPage />, 'platform-security')} />
    <Route path="account" element={guarded(<PlatformAccountPage />, 'platform-account')} />
    <Route path="business-types" element={guarded(<PlatformBusinessTypesPage />, 'platform-business-types')} />
    <Route path="reference-books" element={guarded(<PlatformReferenceBooksPage />, 'platform-reference-books')} />
    <Route path="leads" element={guarded(<PlatformLeadsPage />, 'platform-leads')} />
    <Route path="billing" element={guarded(<PlatformBillingPage />, 'platform-billing')} />
    <Route path="analytics" element={guarded(<PlatformAnalyticsPage />, 'platform-analytics')} />
    <Route path="analytics/companies" element={guarded(<PlatformCompanyAnalyticsPage />, 'platform-analytics-companies')} />
    <Route path="analytics/companies/:companyId" element={guarded(<PlatformCompanyAnalyticsDetailPage />, 'platform-analytics-company')} />
  </Route>
);
