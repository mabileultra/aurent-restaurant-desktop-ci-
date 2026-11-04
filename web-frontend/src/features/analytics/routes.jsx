import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AnalyticsCompaniesPage from './pages/AnalyticsCompaniesPage';
import AnalyticsCompanyDetailPage from './pages/AnalyticsCompanyDetailPage';
import AnalyticsComparePage from './pages/AnalyticsComparePage';
import AnalyticsOverviewPage from './pages/AnalyticsOverviewPage';
import AnalyticsReceiptsPage from './pages/AnalyticsReceiptsPage';
import AnalyticsRegionsPage from './pages/AnalyticsRegionsPage';
import AnalyticsReportsPage from './pages/AnalyticsReportsPage';

export function AnalyticsRoutes() {
  return (
    <Routes>
      <Route index element={<AnalyticsOverviewPage />} />
      <Route path="regions" element={<AnalyticsRegionsPage />} />
      <Route path="companies" element={<AnalyticsCompaniesPage />} />
      <Route path="companies/:companyId" element={<AnalyticsCompanyDetailPage />} />
      <Route path="comparison" element={<AnalyticsComparePage />} />
      <Route path="compare" element={<AnalyticsComparePage />} />
      <Route path="receipts" element={<AnalyticsReceiptsPage />} />
      <Route path="reports" element={<AnalyticsReportsPage />} />
    </Routes>
  );
}

export default AnalyticsRoutes;
