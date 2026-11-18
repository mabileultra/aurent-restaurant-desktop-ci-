import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import ProtectedRoute from '../guards/ProtectedRoute';
import {
  FinanceAccountsPage,
  FinanceAuditPage,
  FinanceCategoriesPage,
  FinanceDashboardPage,
  FinanceDebtsPage,
  FinanceExpensesPage,
  FinanceIncomesPage,
  FinanceReportsPage,
  FinanceSyncPage,
  FinanceTransfersPage,
} from '../lazyPages';

export const adminFinanceRoutes = (
  <>
    <Route
      path="finance/dashboard"
      element={(
        <ProtectedRoute module="financeDashboard">
          <FinanceDashboardPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/incomes"
      element={(
        <ProtectedRoute module="financeIncomes">
          <FinanceIncomesPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/debts"
      element={(
        <ProtectedRoute module="financeDebts">
          <FinanceDebtsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/expenses"
      element={(
        <ProtectedRoute module="financeExpenses">
          <FinanceExpensesPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/accounts"
      element={(
        <ProtectedRoute module="financeAccounts">
          <FinanceAccountsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/transfers"
      element={(
        <ProtectedRoute module="financeTransfers">
          <FinanceTransfersPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/reports"
      element={(
        <ProtectedRoute module="financeReports">
          <FinanceReportsPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/audit"
      element={(
        <ProtectedRoute module="financeAudit">
          <FinanceAuditPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/categories"
      element={(
        <ProtectedRoute module="financeCategories">
          <FinanceCategoriesPage />
        </ProtectedRoute>
      )}
    />
    <Route
      path="finance/sync"
      element={(
        <ProtectedRoute module="financeSync">
          <FinanceSyncPage />
        </ProtectedRoute>
      )}
    />
    <Route path="finance" element={<Navigate to="/finance/dashboard" replace />} />
  </>
);
