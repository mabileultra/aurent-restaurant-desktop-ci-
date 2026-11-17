import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import {
  DeadStockReportPage,
  LowStockReportPage,
  ProductLifecycleReportPage,
  StockAdjustmentsReportPage,
  StockBalancesReportPage,
  StockDashboardPage,
  StockInventoriesReportPage,
  StockMovementsPage,
  StockReceiptsReportPage,
  StockTransfersReportPage,
  StockTurnoverPage,
  WriteOffsReportPage,
} from '../lazyPages';

export const adminReportsStockRoutes = (
  <>
    <Route
      path="reports/stock/write-offs"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockWriteOffs">
          <WriteOffsReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/low"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockLow">
          <LowStockReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/turnover"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockTurnover">
          <StockTurnoverPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/movements"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockMovements">
          <StockMovementsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/receipts"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockReceipts">
          <StockReceiptsReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/balances"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockBalances">
          <StockBalancesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/adjustments"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockAdjustments">
          <StockAdjustmentsReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/dead"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockDead">
          <DeadStockReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/inventories"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockInventories">
          <StockInventoriesReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/transfers"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockTransfers">
          <StockTransfersReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock/lifecycle"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockLifecycle">
          <ProductLifecycleReportPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="reports/stock"
      element={(
        <ProtectedRoute requiredRole="MANAGER" module="reportsStockDashboard">
          <StockDashboardPage />
        </ProtectedRoute>
      )}
    />
  </>
);
