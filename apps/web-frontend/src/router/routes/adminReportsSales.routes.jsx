import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import {
  CashierPerformanceReportPage,
  CategorySalesReportPage,
  DailySummaryReportPage,
  PeriodCompareReportPage,
  ProductSalesReportPage,
  ReportingSyncPage,
  ReportsHubPage,
  ReportsPage,
  ReturnsPage,
  SalesLedgerPage,
  StoreSalesReportPage,
} from '../lazyPages';

export const adminReportsSalesRoutes = (
  <>
    <Route
      path="reports/sales/by-products"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByProducts">
          <ProductSalesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/by-categories"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByCategories">
          <CategorySalesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/by-stores"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesByStores">
          <StoreSalesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/period-compare"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesPeriodCompare">
          <PeriodCompareReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/daily"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSalesDaily">
          <DailySummaryReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales/cashiers"
      element={(
        <ProtectedRoute requiredRole="ADMIN" module="reportsCashierPerformance">
          <CashierPerformanceReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sales"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsSales">
          <SalesLedgerPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/returns"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsReturns">
          <ReturnsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/sync"
      element={(
        <ProtectedRoute module="reportsSync">
          <ReportingSyncPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/analytics"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsAnalytics">
          <ReportsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports"
      element={(
        <ProtectedRoute requiredRole="MANAGER">
          <ReportsHubPage />
        </ProtectedRoute>
      )}
    />
  </>
);
